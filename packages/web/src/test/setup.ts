/**
 * Test Setup
 *
 * Global test configuration for vitest and React Testing Library.
 * Mocks browser APIs not available in happy-dom test environment.
 */

import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';

// Cleanup after each test to prevent memory leaks
afterEach(() => {
  cleanup();
});

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
} as unknown as IDBFactory;

// Mock localStorage if not available or functional
// Node 25+ introduces an experimental localStorage which might conflict with happy-dom or be incomplete
if (
  typeof globalThis.localStorage === 'undefined' ||
  typeof globalThis.localStorage.getItem === 'undefined'
) {
  const localStorageMock = (() => {
    let store: Record<string, string> = {};

    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value.toString();
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
      length: 0,
      key: (index: number) => Object.keys(store)[index] || null,
    };
  })();

  Object.defineProperty(globalThis, 'localStorage', {
    value: localStorageMock,
    writable: true,
    configurable: true,
  });
}
