// Test setup for shared package
// Ensure crypto is available in Node.js test environment
// In Node.js 18+, crypto.randomUUID() is available globally

// Ensure crypto is available (it should be in Node.js 18+, but ensure it exists)
if (typeof globalThis.crypto === 'undefined') {
  // Dynamic import for Node.js crypto polyfill
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const nodeCrypto = require('crypto');
  // @ts-expect-error - Assigning webcrypto polyfill to globalThis.crypto
  globalThis.crypto = nodeCrypto.webcrypto || nodeCrypto;
}
