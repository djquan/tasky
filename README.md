# Tasky

Local-first PWA todo app powered by CRDTs.

## Quick Start

```bash
# Install dependencies
pnpm install

# Run dev server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

## Features

- ✅ Offline-first architecture
- ✅ PWA - installable on desktop/mobile
- ✅ CRDT-based (Yjs) for conflict-free updates
- ✅ IndexedDB persistence
- ✅ Basic todo CRUD (add, edit, complete, delete)
- 🚧 Future: Multi-device sync

## Architecture

**Monorepo** (pnpm workspaces):
- `packages/web` - React PWA (Vite + Tailwind)
- `packages/shared` - Shared types/utils

**Stack**: React, TypeScript, Vite, Tailwind, Yjs, IndexedDB

See [PLAN.md](./PLAN.md) for detailed architecture and roadmap.

## Requirements

- Node.js >= 18
- pnpm >= 8

## Project Structure

```
tasky/
├── packages/
│   ├── shared/          # Shared types and utilities
│   └── web/             # React PWA application
├── PLAN.md              # Detailed development plan
└── package.json         # Root package with workspace scripts
```

## Development

All data stored locally in browser IndexedDB. No server required.

Built with local-first principles - designed to add optional sync server later without breaking changes.
