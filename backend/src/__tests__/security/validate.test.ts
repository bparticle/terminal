/**
 * Input validation unit tests — prototype pollution, length limits, JSON size limits.
 */
import { validateString, validateJsonObject, validateJsonArray, validateStringArray } from '../../middleware/validate';

describe('Validation Helpers', () => {
  describe('validateString', () => {
    it('returns the string when valid', () => {
      expect(validateString('hello', 'field')).toBe('hello');
    });

    it('returns undefined when value is undefined and not required', () => {
      expect(validateString(undefined, 'field')).toBeUndefined();
    });

    it('throws when required and missing', () => {
      expect(() => validateString(undefined, 'field', { required: true })).toThrow('field is required');
    });

    it('throws when value is not a string', () => {
      expect(() => validateString(123, 'field')).toThrow('field must be a string');
    });

    it('enforces minLength', () => {
      expect(() => validateString('ab', 'field', { minLength: 5 })).toThrow('at least 5');
    });

    it('enforces maxLength', () => {
      const long = 'a'.repeat(501);
      expect(() => validateString(long, 'field', { maxLength: 500 })).toThrow('at most 500');
    });

    it('accepts string exactly at maxLength', () => {
      const exact = 'a'.repeat(500);
      expect(validateString(exact, 'field', { maxLength: 500 })).toBe(exact);
    });
  });

  describe('validateJsonObject — fix #22: prototype pollution', () => {
    it('rejects __proto__ key', () => {
      // Can't use object literal with __proto__ — JS engines treat it specially.
      // Build the object via Object.create(null) to include it as a real key.
      const obj = Object.create(null);
      obj['__proto__'] = {};
      expect(() => validateJsonObject(obj, 'obj')).toThrow('disallowed keys');
    });

    it('rejects constructor key', () => {
      expect(() => validateJsonObject({ constructor: {} }, 'obj')).toThrow('disallowed keys');
    });

    it('rejects prototype key', () => {
      expect(() => validateJsonObject({ prototype: {} }, 'obj')).toThrow('disallowed keys');
    });

    it('accepts normal objects', () => {
      const obj = { key: 'value', nested: { a: 1 } };
      expect(validateJsonObject(obj, 'obj')).toEqual(obj);
    });

    it('enforces maxSizeBytes', () => {
      const big = { data: 'x'.repeat(60000) };
      expect(() => validateJsonObject(big, 'obj', { maxSizeBytes: 50000 })).toThrow('exceeds maximum');
    });

    it('returns undefined when not required and missing', () => {
      expect(validateJsonObject(undefined, 'obj')).toBeUndefined();
    });

    it('throws when required and missing', () => {
      expect(() => validateJsonObject(undefined, 'obj', { required: true })).toThrow('obj is required');
    });

    it('rejects arrays', () => {
      expect(() => validateJsonObject([], 'obj')).toThrow('must be a JSON object');
    });
  });

  describe('validateJsonArray', () => {
    it('accepts valid arrays', () => {
      expect(validateJsonArray([1, 2, 3], 'arr')).toEqual([1, 2, 3]);
    });

    it('enforces maxItems', () => {
      const arr = new Array(101).fill('x');
      expect(() => validateJsonArray(arr, 'arr', { maxItems: 100 })).toThrow('maximum of 100');
    });

    it('enforces maxSizeBytes', () => {
      const arr = ['x'.repeat(11000)];
      expect(() => validateJsonArray(arr, 'arr', { maxSizeBytes: 10000 })).toThrow('exceeds maximum');
    });
  });

  describe('validateStringArray', () => {
    it('accepts valid string arrays', () => {
      expect(validateStringArray(['a', 'b'], 'arr')).toEqual(['a', 'b']);
    });

    it('rejects non-string items', () => {
      expect(() => validateStringArray([123 as any], 'arr')).toThrow('must be a string');
    });

    it('enforces maxItems', () => {
      const arr = new Array(51).fill('x');
      expect(() => validateStringArray(arr, 'arr', { maxItems: 50 })).toThrow('maximum of 50');
    });

    it('enforces per-item maxLength', () => {
      expect(() => validateStringArray(['x'.repeat(201)], 'arr', { maxItemLength: 200 })).toThrow('max 200');
    });
  });
});
