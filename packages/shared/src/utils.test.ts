import { describe, it, expect } from 'vitest';
import { generateId, now } from './utils';

describe('utils.ts', () => {
  describe('generateId', () => {
    it('should generate a UUID v4', () => {
      const id = generateId();
      expect(id).toBeTruthy();
      expect(typeof id).toBe('string');
      // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
    });
  });

  describe('now', () => {
    it('should return current timestamp', () => {
      const before = Date.now();
      const timestamp = now();
      const after = Date.now();
      
      expect(timestamp).toBeGreaterThanOrEqual(before);
      expect(timestamp).toBeLessThanOrEqual(after);
      expect(typeof timestamp).toBe('number');
    });

    it('should return milliseconds since epoch', () => {
      const timestamp = now();
      // Should be a reasonable timestamp (after year 2000)
      expect(timestamp).toBeGreaterThan(946684800000); // Jan 1, 2000
      // Should be less than year 2100
      expect(timestamp).toBeLessThan(4102444800000); // Jan 1, 2100
    });
  });
});
