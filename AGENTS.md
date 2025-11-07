# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Tasky is a local-first PWA todo app built with CRDTs (Yjs) for conflict-free data sync. Architecture designed for eventual multi-device sync without breaking changes.

**Requirements:**
- Node.js >= 18
- pnpm >= 8

## Commands

```bash
# Install all workspace dependencies
pnpm install

# Dev server (http://localhost:5173)
pnpm dev

# Production build
pnpm build

# Preview production build
pnpm preview

# Type check all packages
pnpm type-check
```

## Architecture

### Monorepo Structure (pnpm workspaces)

- **packages/shared** - Shared TypeScript types and utilities
  - Exports: `Todo` type, `generateId()`, `now()`
  - Cross-referenced via `workspace:*` protocol

- **packages/web** - React PWA (Vite + Tailwind)
  - Main app with PWA capabilities
  - All commands run through root workspace filters

### Data Layer - Yjs Integration

**Critical Architecture Pattern:**

All state managed through single Yjs document (`packages/web/src/lib/yjs.ts`):
- `ydoc` - Shared Y.Doc instance (singleton)
- `provider` - IndexeddbPersistence for local storage
- `todosArray` - Y.Array<Todo> containing all todos

**CRUD Operations** (`packages/web/src/lib/todos.ts`):
- Mutate todos via Y.Array methods: `.push()`, `.delete()`, `.insert()`
- NEVER directly mutate todo objects - always delete + insert to update
- IndexedDB auto-syncs on every change

**React Integration** (`packages/web/src/hooks/useTodos.ts`):
- `useTodos()` subscribes to Y.Array via `.observe()`
- Wait for `waitForSync()` before initial render
- Unsubscribe via `.unobserve()` on cleanup

### Local-First Design Principles

1. **No server dependency** - Everything works offline immediately
2. **CRDT-based** - Yjs Y.Array enables future conflict-free sync
3. **IndexedDB persistence** - Data survives browser restarts
4. **Distributed IDs** - UUIDs generated client-side via `crypto.randomUUID()`

### PWA Configuration

- Service worker enabled in dev mode (`vite.config.ts` → `devOptions.enabled: true`)
- Manifest configured with SVG icon (`/icon.svg`)
- Install prompt available on localhost and production

## Extending Functionality

### Adding New Todo Operations

1. Add function to `packages/web/src/lib/todos.ts`
2. Follow pattern: find index → delete → insert (for updates)
3. Always call `now()` to update `updatedAt` timestamp
4. React components auto-update via Yjs observer

### Adding Shared Types

1. Define in `packages/shared/src/types.ts`
2. Export from `packages/shared/src/index.ts`
3. Import in web package: `import { Type } from '@tasky/shared'`

### Future Sync Server

When implementing Phase 2 (multi-device sync):
- Create `packages/server` workspace
- Add Yjs WebSocket/WebRTC provider alongside IndexedDB provider
- No changes needed to CRUD operations (CRDT handles conflicts)
- See PLAN.md for roadmap

## TypeScript Configuration

Root `tsconfig.json` shared by all packages. Each package extends with specific settings (JSX for web, declarations for shared).

## Development Notes

- PWA features require HTTPS or localhost
- IndexedDB database name: `tasky-db`
- All timestamps stored as milliseconds (number)
- Todo ordering: insertion order (Y.Array maintains order)
