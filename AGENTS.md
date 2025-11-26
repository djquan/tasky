# AGENTS.md

## Project Overview

Tasky is a local-first PWA todo app built with CRDTs (Yjs) for conflict-free data sync. Architecture designed for eventual multi-device sync without breaking changes.

**Requirements:**

- Node.js >= 25
- pnpm >= 10

## Commands

```bash
# Install all workspace dependencies
pnpm install

# Dev server (http://localhost:8090)
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

- **packages/server** - Y-Sweet sync server (optional)
  - Token generation endpoint for Y-Sweet client access
  - Docker setup for local development
  - See `packages/server/README.md` for setup instructions

### Data Layer - Yjs Integration

**Critical Architecture Pattern:**

All state managed through single Yjs document (`packages/web/src/lib/yjs.ts`):

- `ydoc` - Shared Y.Doc instance (singleton)
- `provider` - IndexeddbPersistence for local storage (always enabled)
- `syncProvider` - Y-Sweet sync provider (optional, enabled via environment variables)
- Both providers sync to the same `ydoc` instance

**Provider Stack:**

```
ydoc (single Y.Doc)
├── IndexeddbPersistence (local storage - always enabled)
└── YSweetProvider (remote sync - optional)
```

**CRUD Operations** (`packages/web/src/lib/tasks.ts`, `packages/web/src/lib/lists.ts`, etc.):

- Mutate entities via Y.Map methods: `.set()`, `.delete()`
- NEVER directly mutate entity objects - always delete + set to update
- IndexedDB auto-syncs on every change
- Y-Sweet syncs changes to remote server when enabled

**React Integration** (`packages/web/src/hooks/useTodos.ts`):

- `useTodos()` subscribes to Y.Array via `.observe()`
- Wait for `waitForSync()` before initial render
- Unsubscribe via `.unobserve()` on cleanup

### Local-First Design Principles

1. **No server dependency** - Everything works offline immediately
2. **CRDT-based** - Yjs Y.Map/Y.Array enables conflict-free sync
3. **IndexedDB persistence** - Data survives browser restarts (always enabled)
4. **Distributed IDs** - UUIDs generated client-side via `crypto.randomUUID()`
5. **Optional remote sync** - Y-Sweet provider adds multi-device sync when enabled

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

### Multi-Device Sync (Y-Sweet)

**Architecture:**

- **Single document**: All entities (tasks, lists, tags, etc.) stored in one Y.Doc
- **Hybrid persistence**: IndexedDB (primary) + Y-Sweet (sync layer)
- **No authentication**: Single-user setup, no auth required
- **Self-hosted**: Y-Sweet server runs locally or on infrastructure

**Setup:**

1. **Start Y-Sweet server** (see `packages/server/README.md`):

   ```bash
   cd packages/server
   docker-compose up -d
   ```

2. **Configure web app** (`packages/web/.env`):

   ```env
   VITE_SYNC_ENABLED=true
   VITE_YSWEET_URL=ws://localhost:1234
   VITE_YSWEET_TOKEN_URL=http://localhost:8092/token
   ```

3. **Sync initializes automatically** when `waitForSync()` is called

**Connection Management:**

- Automatic reconnection with exponential backoff
- Offline fallback: IndexedDB continues working when server unavailable
- Connection state tracking via `getSyncState()`
- See `packages/web/src/lib/sync.ts` for implementation details

**Document Structure:**

- Single document ID: `tasky-main` (configurable via `VITE_DOCUMENT_ID`)
- All Y.Maps and Y.Arrays sync automatically via CRDT
- No changes needed to CRUD operations (conflicts handled automatically)

## TypeScript Configuration

Root `tsconfig.json` shared by all packages. Each package extends with specific settings (JSX for web, declarations for shared).

## Development Notes

- Before making a pull request, ensure all tests and linting passes.
- PWA features require HTTPS or localhost
- IndexedDB database name: `tasky-db`
- All timestamps stored as milliseconds (number)
- Todo ordering: insertion order (Y.Array maintains order)
