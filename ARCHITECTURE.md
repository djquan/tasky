# Architecture Documentation

## Overview

Tasky is a local-first PWA todo application built with a focus on offline-first functionality, eventual multi-device sync, and a clean, maintainable codebase.

## Core Technologies

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS 4
- **State Management**: Yjs CRDTs + Zustand (UI state)
- **Testing**: Vitest + React Testing Library
- **Package Manager**: pnpm workspaces

## Architecture Principles

### 1. Local-First Design

The application prioritizes local functionality:
- All data operations work offline immediately
- IndexedDB persistence ensures data survives browser restarts
- No server dependency for core functionality
- Optional Y-Sweet provider adds multi-device sync

### 2. CRDT-Based Sync

Using Yjs for conflict-free data synchronization:
- Automatic conflict resolution
- Distributed ID generation (UUIDs)
- Y.Map and Y.Array for all entities
- Single shared Y.Doc for all data

### 3. Monorepo Structure

```
packages/
├── shared/       # Shared types and utilities
├── web/          # React PWA application
└── server/       # Y-Sweet sync server (optional)
```

## Data Layer

### Entity Model

All entities follow a consistent pattern:

```typescript
interface Entity {
  id: string;              // UUID generated client-side
  createdAt: number;       // Millisecond timestamp
  updatedAt: number;       // Millisecond timestamp
  sortOrder: number;       // For manual ordering
}
```

Core entities:
- **Task**: Todo items with when/scheduled/deadline
- **List**: Projects and Areas (unified via `type` field)
- **Tag**: Hierarchical labels with colors
- **Heading**: Project section dividers
- **ChecklistItem**: Sub-tasks within tasks

### Yjs Integration

File: `packages/web/src/lib/yjs.ts`

```
ydoc (Y.Doc)
├── IndexeddbPersistence (always enabled)
└── YSweetProvider (optional, when sync enabled)
```

**Important**: Both providers sync to the same `ydoc` instance.

### CRUD Operations

Pattern used across all entity types:

```typescript
// Create
function createEntity(input: EntityInput): Entity {
  const id = generateId();
  const timestamp = now();
  const entity = { id, ...input, createdAt: timestamp, updatedAt: timestamp };

  // Add to Y.Map
  entityMap.set(id, entity);

  // Add to sort order
  addToSortOrder(entity);

  return entity;
}

// Update
function updateEntity(id: string, updates: Partial<Entity>): void {
  const entity = entityMap.get(id);
  const updated = { ...entity, ...updates, updatedAt: now() };

  // NEVER mutate - always delete + set
  entityMap.set(id, updated);
}

// Delete
function deleteEntity(id: string): void {
  removeFromSortOrder(entity);
  entityMap.delete(id);
}
```

**Critical**: Never directly mutate entity objects. Always use `map.set()` to trigger Yjs sync.

## React Integration

### Hooks Pattern

File: `packages/web/src/hooks/useEntities.ts`

```typescript
export function useEntities() {
  const [entities, setEntities] = useState([]);

  useEffect(() => {
    // Wait for initial sync
    waitForSync().then(() => {
      setEntities(Array.from(entityMap.values()));
    });

    // Subscribe to changes
    const observer = () => {
      setEntities(Array.from(entityMap.values()));
    };
    entityMap.observe(observer);

    return () => entityMap.unobserve(observer);
  }, []);

  return { entities, isLoading };
}
```

### State Management

Two-tier approach:
1. **Data State**: Yjs (synced entities)
2. **UI State**: Zustand (navigation, selection, popups)

File: `packages/web/src/store/navigation.ts`

```typescript
interface NavigationStore {
  currentView: ViewType;
  currentListId: string | null;
  selectedTaskIds: Set<string>;
  taskDetailOpen: boolean;
  // ... UI-only state
}
```

### Component Architecture

```
App
├── Sidebar (navigation)
├── MainView
│   ├── SmartListView (Inbox, Today, etc.)
│   │   └── TaskList
│   │       └── TaskRow
│   └── ListView (Projects, Areas, Tags)
│       └── TaskList
│           └── TaskRow
└── Popups
    ├── TaskDetailPopup
    ├── QuickAddPopup
    └── SearchPopup
```

## Undo/Redo System

File: `packages/web/src/lib/undo/`

Custom undo manager with Command pattern:
- Each operation (create, update, delete) is a Command
- Commands know how to execute(), undo(), and redo()
- Undo stack limited to 50 operations
- Undo/Redo bypass command creation to prevent stack pollution

## View System

### Smart Lists (Dynamic)

Calculated from task properties:
- **Inbox**: No when, dates, project, or area
- **Today**: `when === 'today'` OR `scheduledDate === today`
- **Anytime**: `when === 'anytime'`
- **Someday**: `when === 'someday'`
- **Upcoming**: Has `scheduledDate` OR `deadline`
- **Logbook**: `completed === true`
- **Trash**: `canceled === true`

### Custom Lists (Static)

User-created containers:
- **Projects**: Lists with `type: 'project'`
- **Areas**: Lists with `type: 'area'`
- **Tags**: Hierarchical tag-based filtering

## Sync Architecture

### Provider Stack

```typescript
// packages/web/src/lib/sync.ts
class SyncProvider {
  connect(tokenUrl: string)
  disconnect()
  getSyncState(): 'connected' | 'connecting' | 'disconnected'
}
```

Connection flow:
1. Fetch client token from server (`/token` endpoint)
2. Initialize Y-Sweet WebSocket provider
3. Automatic reconnection with exponential backoff
4. Offline fallback to IndexedDB

### Server

Simple Express server (packages/server):
- Single endpoint: `POST /token`
- Generates Y-Sweet client tokens
- No authentication (single-user design)
- CORS-restricted to known origins

## Error Handling

Centralized error logging:

```typescript
// packages/web/src/lib/errorHandler.ts
export function handleOperationError(
  operation: string,
  error: Error,
  context?: ErrorContext
): void {
  logError(error, ErrorSeverity.ERROR, { operation, ...context });
}
```

Severity levels: INFO, WARNING, ERROR, CRITICAL

## Testing Strategy

### Unit Tests

- Data operations (`lib/**/*.test.ts`)
- Filter logic
- Undo/redo system
- Sync integration

### Component Tests

- Critical UI components (TaskRow, ListView)
- User interactions
- Keyboard shortcuts
- Selection behavior

### Test Utilities

```typescript
// packages/web/src/test/utils.ts
createMockYMap()
createMockYArray()
createMockYjsDocument()
resetMockYjsDocument()

// packages/web/src/test/component-utils.tsx
renderWithProviders()
createMockTask()
createMockList()
createMockTag()
```

## Performance Optimizations

1. **Memoization**: React.memo, useMemo, useCallback on critical paths
2. **Lazy Loading**: Dynamic imports for heavy components
3. **Virtual Scrolling**: Considered for large task lists (not yet implemented)
4. **Debouncing**: Search input, auto-save

## Security Considerations

1. **Input Validation**:
   - Length limits on all text fields
   - Sanitization of user input
   - URL validation for sync settings

2. **CORS**:
   - Whitelist-based origin restrictions
   - No wildcards in production

3. **XSS Prevention**:
   - React's built-in escaping
   - No `dangerouslySetInnerHTML`

## PWA Features

- Service worker with dev mode support
- Offline functionality via IndexedDB
- Install prompt
- SVG icon with manifest

## Future Considerations

1. **Multi-User Support**: Authentication layer for Y-Sweet
2. **E2E Encryption**: For sensitive data
3. **Attachments**: File upload and sync
4. **Collaboration**: Real-time multi-user editing
5. **Mobile Apps**: React Native wrapper

## Development Workflow

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Run tests
pnpm test

# Type check
pnpm type-check

# Lint
pnpm lint

# Build for production
pnpm build
```

## Deployment

### Web App

Standard static site hosting (Vercel, Netlify, etc.):
1. Build: `pnpm build`
2. Deploy: `packages/web/dist/`

### Sync Server

Docker-based deployment:
1. Build: `docker-compose build`
2. Deploy: `docker-compose up -d`

## Key Design Decisions

### Why Yjs?

- Mature CRDT library
- Excellent offline support
- Built-in sync providers
- TypeScript support

### Why Monorepo?

- Shared types between packages
- Coordinated versioning
- Single dependency graph

### Why No Database?

- Simplifies architecture
- Reduces latency
- Better offline experience
- Y-Sweet handles persistence

### Why Zustand for UI?

- Lightweight (< 1KB)
- No boilerplate
- Easy to test
- Complements Yjs well

## Troubleshooting

### Common Issues

1. **Sync not working**: Check token URL and CORS settings
2. **Tests failing**: Ensure mocks are reset in beforeEach
3. **Type errors**: Run `pnpm type-check` for details
4. **Build errors**: Clear `node_modules` and reinstall

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines.
