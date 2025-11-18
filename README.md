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
- ✅ Multi-device sync (Y-Sweet) - optional, self-hosted

## Architecture

**Monorepo** (pnpm workspaces):

- `packages/web` - React PWA (Vite + Tailwind)
- `packages/shared` - Shared types/utils
- `packages/server` - Y-Sweet sync server (optional)

**Stack**: React, TypeScript, Vite, Tailwind, Yjs, IndexedDB, Y-Sweet

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

## Multi-Device Sync (Optional)

Tasky supports optional multi-device synchronization via Y-Sweet:

1. **Start sync server**:

   ```bash
   cd packages/server
   docker-compose up -d
   ```

2. **Enable sync in web app** (via Settings UI):

   - Open the web app
   - Go to Settings → Enable sync
   - Enter token URL: `http://localhost:8093/token` (nginx proxy - recommended)
   - Save

3. **Sync initializes automatically** when enabled

See `packages/server/README.md` for detailed setup instructions.
