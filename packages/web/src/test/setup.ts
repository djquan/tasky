// Test setup file for vitest
// Mocks global APIs not available in happy-dom test environment

// Mock IndexedDB for y-indexeddb
// The yjs.ts module initializes IndexeddbPersistence at module level,
// which requires indexedDB to be available even though tests mock the functions
globalThis.indexedDB = {
  open: () => ({
    onsuccess: null,
    onerror: null,
    onupgradeneeded: null,
    result: {
      transaction: () => ({
        objectStore: () => ({
          get: () => ({ onsuccess: null, onerror: null }),
          put: () => ({ onsuccess: null, onerror: null }),
          delete: () => ({ onsuccess: null, onerror: null }),
        }),
      }),
    },
  }),
  deleteDatabase: () => ({ onsuccess: null, onerror: null }),
} as any;
