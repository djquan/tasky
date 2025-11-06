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

export interface Task {
  id: string;
  title: string;
  notes: string;
  when: WhenValue;
  scheduledDate: number | null;  // Timestamp for specific date scheduling
  deadline: number | null;       // Timestamp for deadline
  tags: string[];                // Array of tag IDs
  checklistItems: string[];      // Array of checklist item IDs
  // IMPORTANT: projectId and areaId are mutually exclusive
  // - If projectId is set, task belongs to that project (areaId should be null)
  // - If areaId is set, task belongs directly to that area (projectId should be null)
  // - If both are null, task may appear in Inbox (if no dates/when)
  projectId: string | null;
  areaId: string | null;
  headingId: string | null;      // Only valid when projectId is set
  completed: boolean;
  canceled: boolean;
  createdAt: number;
  completedAt: number | null;
  updatedAt: number;
  sortOrder: number;
}

export interface Project {
  id: string;
  title: string;
  notes: string;
  when: WhenValue;
  scheduledDate: number | null;
  deadline: number | null;
  areaId: string | null;
  tags: string[];
  completed: boolean;
  canceled: boolean;
  createdAt: number;
  completedAt: number | null;
  updatedAt: number;
  sortOrder: number;
}

export interface Area {
  id: string;
  title: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  sortOrder: number;
}

export interface Heading {
  id: string;
  title: string;
  projectId: string;
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
export type ProjectInput = Omit<Project, 'id' | 'createdAt' | 'completedAt' | 'updatedAt'>;
export type AreaInput = Omit<Area, 'id' | 'createdAt' | 'updatedAt'>;
export type HeadingInput = Omit<Heading, 'id' | 'createdAt' | 'updatedAt'>;
export type TagInput = Omit<Tag, 'id' | 'createdAt' | 'updatedAt'>;
export type ChecklistItemInput = Omit<ChecklistItem, 'id' | 'createdAt' | 'updatedAt'>;

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
