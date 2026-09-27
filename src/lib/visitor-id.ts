import { v4 as uuidv4, validate as uuidValidate } from 'uuid';

export const VISITOR_ID_STORAGE_KEY = 'jehovahs-light:visitor-id';

let memoryVisitorId: string | null = null;

export function isValidVisitorId(value: unknown): value is string {
  return typeof value === 'string' && uuidValidate(value);
}

/**
 * Anonymous id for this browser, used to count one lamp per person.
 * Falls back to an in-memory id when localStorage is blocked (private mode).
 */
export function getVisitorId(): string {
  if (typeof window === 'undefined') return uuidv4();
  try {
    const stored = window.localStorage.getItem(VISITOR_ID_STORAGE_KEY);
    if (isValidVisitorId(stored)) return stored;
    const fresh = uuidv4();
    window.localStorage.setItem(VISITOR_ID_STORAGE_KEY, fresh);
    return fresh;
  } catch {
    memoryVisitorId ??= uuidv4();
    return memoryVisitorId;
  }
}
