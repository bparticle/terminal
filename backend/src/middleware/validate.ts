/**
 * Input validation helpers.
 * All validators throw AppError on failure.
 */
import { AppError } from './errorHandler';

/** Ensure a string field meets length constraints */
export function validateString(
  value: unknown,
  fieldName: string,
  opts: { minLength?: number; maxLength?: number; required?: boolean } = {},
): string | undefined {
  const { minLength = 0, maxLength = 500, required = false } = opts;

  if (value === undefined || value === null) {
    if (required) throw new AppError(`${fieldName} is required`, 400);
    return undefined;
  }

  if (typeof value !== 'string') {
    throw new AppError(`${fieldName} must be a string`, 400);
  }

  if (value.length < minLength) {
    throw new AppError(`${fieldName} must be at least ${minLength} characters`, 400);
  }

  if (value.length > maxLength) {
    throw new AppError(`${fieldName} must be at most ${maxLength} characters`, 400);
  }

  return value;
}

/** Ensure a value is a plain object and within a size limit (serialized) */
export function validateJsonObject(
  value: unknown,
  fieldName: string,
  opts: { maxSizeBytes?: number; required?: boolean } = {},
): Record<string, unknown> | undefined {
  const { maxSizeBytes = 50_000, required = false } = opts;

  if (value === undefined || value === null) {
    if (required) throw new AppError(`${fieldName} is required`, 400);
    return undefined;
  }

  if (typeof value !== 'object' || Array.isArray(value)) {
    throw new AppError(`${fieldName} must be a JSON object`, 400);
  }

  // Reject prototype pollution keys
  const dangerousKeys = ['__proto__', 'constructor', 'prototype'];
  if (Object.keys(value as object).some(k => dangerousKeys.includes(k))) {
    throw new AppError(`${fieldName} contains disallowed keys`, 400);
  }

  const serialized = JSON.stringify(value);
  if (serialized.length > maxSizeBytes) {
    throw new AppError(`${fieldName} exceeds maximum allowed size`, 400);
  }

  return value as Record<string, unknown>;
}

/** Ensure a value is an array and within a size limit */
export function validateJsonArray(
  value: unknown,
  fieldName: string,
  opts: { maxItems?: number; maxSizeBytes?: number; required?: boolean } = {},
): unknown[] | undefined {
  const { maxItems = 100, maxSizeBytes = 10_000, required = false } = opts;

  if (value === undefined || value === null) {
    if (required) throw new AppError(`${fieldName} is required`, 400);
    return undefined;
  }

  if (!Array.isArray(value)) {
    throw new AppError(`${fieldName} must be an array`, 400);
  }

  if (value.length > maxItems) {
    throw new AppError(`${fieldName} exceeds maximum of ${maxItems} items`, 400);
  }

  const serialized = JSON.stringify(value);
  if (serialized.length > maxSizeBytes) {
    throw new AppError(`${fieldName} exceeds maximum allowed size`, 400);
  }

  return value;
}

/** Validate a URL string (basic format check) */
export function validateUrl(
  value: unknown,
  fieldName: string,
  opts: { maxLength?: number; required?: boolean } = {},
): string | undefined {
  const { maxLength = 2048, required = false } = opts;

  const str = validateString(value, fieldName, { maxLength, required });
  if (str === undefined) return undefined;

  try {
    const url = new URL(str);
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new AppError(`${fieldName} must use http or https`, 400);
    }
  } catch (e) {
    if (e instanceof AppError) throw e;
    throw new AppError(`${fieldName} must be a valid URL`, 400);
  }

  return str;
}

/** Validate an array of strings (e.g., target_states) */
export function validateStringArray(
  value: unknown,
  fieldName: string,
  opts: { maxItems?: number; maxItemLength?: number; required?: boolean } = {},
): string[] | undefined {
  const { maxItems = 50, maxItemLength = 200, required = false } = opts;

  if (value === undefined || value === null) {
    if (required) throw new AppError(`${fieldName} is required`, 400);
    return undefined;
  }

  if (!Array.isArray(value)) {
    throw new AppError(`${fieldName} must be an array`, 400);
  }

  if (value.length > maxItems) {
    throw new AppError(`${fieldName} exceeds maximum of ${maxItems} items`, 400);
  }

  for (const item of value) {
    if (typeof item !== 'string' || item.length > maxItemLength) {
      throw new AppError(`Each item in ${fieldName} must be a string (max ${maxItemLength} chars)`, 400);
    }
  }

  return value as string[];
}
