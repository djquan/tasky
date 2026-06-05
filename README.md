# Tasky

Local-first PWA todo app powered by CRDTs.

<img width="1253" height="1224" alt="Screenshot 2025-11-25 at 6 59 28 PM" src="https://github.com/user-attachments/assets/56eab7d8-b46a-45f3-ac3a-2a23a04d839c" />

<img width="1152" height="1230" alt="Screenshot 2025-11-25 at 7 00 17 PM" src="https://github.com/user-attachments/assets/f79fbf14-4b6c-49fc-8199-e5246078c3ef" />


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

- Node.js >= 25
- pnpm >= 10

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

2. **Configure the default sync URL for the web app** (`packages/web/.env`):

   ```env
   VITE_SYNC_URL=http://localhost:8092
   ```

3. **Restart dev server**, open Settings, and enable sync. The app uses `VITE_SYNC_URL` as the default sync server URL.

See `packages/server/README.md` for detailed setup instructions.
