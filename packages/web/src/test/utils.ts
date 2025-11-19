/**
 * Shared Test Utilities
 *
 * Common test helpers and mock factories to reduce duplication across test files.
 */

/**
 * Creates a mock Y.Map implementation for testing
 */
export function createMockYMap<T>(): Map<string, T> & {
  observe?: (callback: () => void) => void;
  unobserve?: (callback: () => void) => void;
} {
  const map = new Map<string, T>();

  // Add Yjs observer methods (no-op for tests)
  (map as Map<string, T> & Record<string, unknown>).observe = () => {};
  (map as Map<string, T> & Record<string, unknown>).unobserve = () => {};

  return map;
}

/**
 * Creates a mock Y.Array implementation for testing
 */
export function createMockYArray<T = string>(): Array<T> & {
  push: (items: T[]) => void;
  toArray: () => T[];
  delete: (index: number, length: number) => void;
  insert: (index: number, items: T[]) => void;
  indexOf: (item: T) => number;
  observe?: (callback: () => void) => void;
  unobserve?: (callback: () => void) => void;
} {
  const array: T[] = [];

  const mockArray = Object.assign(array, {
    push: (items: T[]) => {
      array.push(...items);
    },
    toArray: () => [...array],
    delete: (index: number, length: number) => {
      array.splice(index, length);
    },
    insert: (index: number, items: T[]) => {
      array.splice(index, 0, ...items);
    },
    indexOf: (item: T) => array.indexOf(item),
    observe: () => {},
    unobserve: () => {},
  });

  return mockArray;
}

/**
 * Resets a mock Y.Array to empty state
 */
export function resetMockYArray<T = unknown>(array: ReturnType<typeof createMockYArray<T>>): void {
  array.length = 0;
}

/**
 * Creates a complete mock Yjs document structure for testing
 */
export function createMockYjsDocument() {
  const tasksMap = createMockYMap();
  const listsMap = createMockYMap();
  const tagsMap = createMockYMap();
  const headingsMap = createMockYMap();
  const checklistItemsMap = createMockYMap();

  const inboxSortOrder = createMockYArray();
  const todaySortOrder = createMockYArray();
  const anytimeSortOrder = createMockYArray();
  const somedaySortOrder = createMockYArray();
  const listsSortOrder = createMockYArray();
  const tagsSortOrder = createMockYArray();

  const listTaskSortOrders = new Map<string, string[]>();
  const listHeadingsSortOrders = new Map<string, string[]>();

  return {
    tasksMap,
    listsMap,
    tagsMap,
    headingsMap,
    checklistItemsMap,
    inboxSortOrder,
    todaySortOrder,
    anytimeSortOrder,
    somedaySortOrder,
    listsSortOrder,
    tagsSortOrder,
    listTaskSortOrders,
    listHeadingsSortOrders,
  };
}

/**
 * Resets all mock state in a Yjs document
 */
export function resetMockYjsDocument(doc: ReturnType<typeof createMockYjsDocument>): void {
  doc.tasksMap.clear();
  doc.listsMap.clear();
  doc.tagsMap.clear();
  doc.headingsMap.clear();
  doc.checklistItemsMap.clear();

  resetMockYArray(doc.inboxSortOrder);
  resetMockYArray(doc.todaySortOrder);
  resetMockYArray(doc.anytimeSortOrder);
  resetMockYArray(doc.somedaySortOrder);
  resetMockYArray(doc.listsSortOrder);
  resetMockYArray(doc.tagsSortOrder);

  doc.listTaskSortOrders.clear();
  doc.listHeadingsSortOrders.clear();
}

/**
 * Creates a mock undo manager for testing
 */
export function createMockUndoManager() {
  let isUndoing = false;
  let isRedoing = false;

  return {
    execute: () => {},
    undo: () => {
      isUndoing = true;
    },
    redo: () => {
      isRedoing = true;
    },
    canUndo: () => false,
    canRedo: () => false,
    getIsUndoing: () => isUndoing,
    getIsRedoing: () => isRedoing,
    clear: () => {},
  };
}
