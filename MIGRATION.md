# Things 3 Migration Status

## ✅ Phase 1: Data Layer & Core Views (Completed)

### Data Layer
- **Types**: Complete Things 3 entity schema (Task, Project, Area, Heading, Tag, ChecklistItem, WhenValue, ViewType)
- **Yjs Schema**: Migrated from Y.Array to Y.Map structure with sort order arrays
- **CRUD Operations**: Full implementations for all 6 entity types
  - `lib/tasks.ts` - Task CRUD with sort order management
  - `lib/projects.ts` - Project CRUD
  - `lib/areas.ts` - Area CRUD
  - `lib/tags.ts` - Tag CRUD with hierarchical support
  - `lib/headings.ts` - Heading CRUD for project sections
  - `lib/checklists.ts` - Checklist item CRUD
- **Filter Engine**: Smart list logic (`lib/filters.ts`)
  - Inbox, Today, Anytime, Someday, Upcoming, Logbook
  - Date-based filtering with overdue detection
  - Counts for sidebar badges

### State Management
- **Navigation Context**: React Context for view routing and UI state
- **Entity Hooks**: `useEntities.ts` with hooks for all entity types
- **Smart List Hooks**: `useSmartLists.ts` with hooks for all views

### UI Components - Smart Lists
- **Layout**: `AppLayout`, `Sidebar`, `BottomNav` (responsive)
- **Task Components**: `TaskRow`, `TaskList`, `AddTaskInput`
- **View Components**: All 6 smart list views
  - InboxView, TodayView (with This Evening), AnytimeView
  - SomedayView, UpcomingView (grouped by date), LogbookView
- **ViewRouter**: Navigation-based view rendering

### App Structure
- App.tsx wired with NavigationProvider → AppLayout → ViewRouter
- Sidebar navigation with smart list counts
- Mobile bottom nav
- Desktop/mobile adaptive UI

---

## ✅ Phase 2: Advanced Features (Completed)

### Task Detail Panel
- **TaskDetail Component**: Slide-in panel from right (Things 3 style)
  - Full task editing (title, notes)
  - Checklist item management (add, toggle, delete)
  - When picker (inbox, today, evening, anytime, someday)
  - Date pickers (deadline, scheduled date)
  - Tag picker with inline tag creation
  - Project/Area assignment
  - Task completion and deletion
- Click any task to open detail panel

### Picker Components
- **WhenPicker**: Select when field with visual options
- **DatePicker**: Date selector with quick options (today, tomorrow, next week)
- **TagPicker**: Multi-select tags with inline creation
- **ProjectAreaPicker**: Hierarchical project/area selection

### Project & Area Views
- **ProjectView**: Display project with grouped tasks
  - Heading support (create, delete, organize tasks)
  - Tasks without headings shown at top
  - Project notes display
  - Add tasks directly to project
- **AreaView**: Display area with projects and tasks
  - List all projects in area (clickable to navigate)
  - Create new projects in area
  - Direct tasks in area (not in projects)
  - Navigate between area and its projects

### Quick Entry (Cmd+Space)
- **QuickEntry Component**: Global keyboard-activated overlay
  - Cmd/Ctrl + Space to open/close
  - Three modes: Task, Project, Area
  - Task mode: Select when, project, area
  - Project mode: Select area
  - Minimal, focused UI
- Accessible from anywhere in the app

### Sidebar Enhancements
- Quick Entry trigger button (+ icon)
- Full area/project hierarchy display
- Active project filtering

---

## 🚧 TODO (Phase 3)

### Cleanup
- [ ] Remove old files (manual cleanup needed):
  - `packages/web/src/components/AddTodo.tsx`
  - `packages/web/src/components/TodoItem.tsx`
  - `packages/web/src/components/TodoList.tsx`
  - `packages/web/src/hooks/useTodos.ts`
  - `packages/web/src/lib/todos.ts`

### Testing Phase 2 Features
- [ ] Test task detail panel (click any task)
- [ ] Test checklist items within task detail
- [ ] Test tag creation and assignment
- [ ] Test date/deadline pickers
- [ ] Test when picker (moving tasks between views)
- [ ] Test project/area assignment
- [ ] Test Quick Entry (Cmd+Space)
- [ ] Test project view with headings
- [ ] Test area view with project creation
- [ ] Test navigation between areas and projects

### Phase 3 Features (Pending)
- [ ] Drag & drop reordering (tasks, headings, projects)
- [ ] Additional keyboard shortcuts
  - Arrow keys for navigation
  - Delete key for quick delete
  - Cmd+E for "This Evening"
  - Cmd+K for Quick Find
- [ ] Animations/transitions
  - Task completion animation
  - View transitions
  - Detail panel slide
- [ ] Search/Quick Find (Cmd+K)
  - Search tasks, projects, areas, tags
  - Jump to result
- [ ] Tag view (show all tasks with specific tag)
- [ ] Project/Area editing and deletion
- [ ] Repeating tasks
- [ ] Task templates

---

## Known Issues

### Data Migration
- **Breaking Change**: New Yjs schema incompatible with old data
- **Impact**: Existing todos will NOT migrate automatically
- **Solution**: IndexedDB will be cleared on first load (fresh start)

### Phase 3 Limitations
- No drag & drop reordering yet
- Limited keyboard shortcuts (only Quick Entry)
- No animations/transitions
- No search/Quick Find
- No tag view
- No project/area editing UI (only via Quick Entry)
- No repeating tasks

---

## Architecture Notes

### Yjs Structure
**Old (v0.1.0)**:
```typescript
Y.Array<Todo>('todos') // Simple array
```

**New (Things 3)**:
```typescript
Y.Map<Task>('tasks')                    // Tasks by ID
Y.Map<Project>('projects')               // Projects by ID
Y.Map<Area>('areas')                     // Areas by ID
Y.Map<Tag>('tags')                       // Tags by ID
Y.Map<Heading>('headings')               // Headings by ID
Y.Map<ChecklistItem>('checklistItems')   // Checklist items by ID

// Sort order arrays
Y.Array<string>('inboxSortOrder')
Y.Array<string>('todaySortOrder')
// etc...
```

### Smart List Logic
Tasks appear in views based on `when` field + dates:
- **Inbox**: `when='inbox'` AND no project/area
- **Today**: `when='today'|'evening'` OR `scheduledDate=today` OR `deadline=today|overdue`
- **Anytime**: `when='anytime'` OR (`when='inbox'` AND has project/area)
- **Someday**: `when='someday'`
- **Upcoming**: `scheduledDate` OR `deadline` in future
- **Logbook**: `completed=true` OR `canceled=true`

### Component Hierarchy
```
App
└── NavigationProvider
    └── AppLayout
        ├── Sidebar (desktop)
        ├── BottomNav (mobile)
        └── ViewRouter
            ├── InboxView
            ├── TodayView
            ├── AnytimeView
            ├── SomedayView
            ├── UpcomingView
            └── LogbookView
```

---

## Next Steps

1. **Immediate**: Test current implementation
   ```bash
   pnpm install
   pnpm dev
   ```

2. **Short-term**: Implement Project/Area views
   - Display project/area tasks
   - Show headings
   - Task creation within context

3. **Medium-term**: Task detail panel
   - Notes editing
   - Checklist items
   - Tags, dates, project/area assignment

4. **Long-term**: Advanced features
   - Quick Entry
   - Drag & drop
   - Keyboard shortcuts
   - Search
