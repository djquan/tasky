// ============================================================================
// Enums and Type Unions
// ============================================================================

export type WhenValue =
  | 'today'      // Scheduled for today
  | 'evening'    // Scheduled for this evening (subset of today)
  | 'anytime'    // No specific schedule, actionable now
  | 'someday';   // Intentionally deferred, not actionable
  // Note: 'inbox' is not a when value - it's calculated as absence of when/dates/project/area

export type ViewType =
  | 'inbox'
  | 'today'
  | 'anytime'
  | 'someday'
  | 'upcoming'
  | 'logbook'
  | 'area'
  | 'project'
  | 'tag';

// ============================================================================
// Core Entities
// ============================================================================

export type ListType = 'project' | 'area';

export interface Task {
  id: string;
  title: string;
  notes: string;
  when: WhenValue;
  scheduledDate: number | null;  // Timestamp for specific date scheduling
  deadline: number | null;       // Timestamp for deadline
  tags: string[];                // Array of tag IDs
  checklistItems: string[];      // Array of checklist item IDs
  listId: string | null;         // ID of the list (project or area) this task belongs to
  headingId: string | null;      // Only valid when listId points to a project-type list
  completed: boolean;
  canceled: boolean;
  createdAt: number;
  completedAt: number | null;
  updatedAt: number;
  sortOrder: number;
}

export interface List {
  id: string;
  type: ListType;                // 'project' or 'area'
  title: string;
  notes: string;
  when: WhenValue;
  scheduledDate: number | null;
  deadline: number | null;
  parentListId: string | null;   // For projects: ID of parent area; for areas: always null
  tags: string[];
  completed: boolean;
  canceled: boolean;
  createdAt: number;
  completedAt: number | null;
  updatedAt: number;
  sortOrder: number;
}

// Legacy type aliases for backward compatibility
export type Project = List & { type: 'project' };
export type Area = List & { type: 'area' };

export interface Heading {
  id: string;
  title: string;
  listId: string;               // ID of the project-type list this heading belongs to
  archived: boolean;
  createdAt: number;
  updatedAt: number;
  sortOrder: number;
}

export interface Tag {
  id: string;
  name: string;
  parentId: string | null;
  color: string;  // Hex color for tag badge
  createdAt: number;
  updatedAt: number;
  sortOrder: number;
}

export interface ChecklistItem {
  id: string;
  taskId: string;
  title: string;
  completed: boolean;
  canceled: boolean;
  createdAt: number;
  updatedAt: number;
  sortOrder: number;
}

// ============================================================================
// Input Types (for creation)
// ============================================================================

export type TaskInput = Omit<Task, 'id' | 'createdAt' | 'completedAt' | 'updatedAt'>;
export type ListInput = Omit<List, 'id' | 'createdAt' | 'completedAt' | 'updatedAt'>;
export type HeadingInput = Omit<Heading, 'id' | 'createdAt' | 'updatedAt'>;
export type TagInput = Omit<Tag, 'id' | 'createdAt' | 'updatedAt'>;
export type ChecklistItemInput = Omit<ChecklistItem, 'id' | 'createdAt' | 'updatedAt'>;

// Legacy input types for backward compatibility
export type ProjectInput = ListInput & { type: 'project' };
export type AreaInput = ListInput & { type: 'area' };

// ============================================================================
// Helper Types
// ============================================================================

export interface SmartListCounts {
  inbox: number;
  today: number;
  anytime: number;
  someday: number;
  upcoming: number;
  logbook: number;
}

// Legacy type alias for backward compatibility during migration
export type Todo = Task;
