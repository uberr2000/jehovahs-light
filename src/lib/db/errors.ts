const CONNECTION_CODES = new Set([
  'ECONNREFUSED',
  'ENOTFOUND',
  'ETIMEDOUT',
  'ECONNRESET',
  'EHOSTUNREACH',
  'ENETUNREACH',
  'EAI_AGAIN',
  'PROTOCOL_CONNECTION_LOST',
  'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR',
  'ER_ACCESS_DENIED_ERROR',
  'ER_BAD_DB_ERROR',
  'ER_DBACCESS_DENIED_ERROR',
  'ER_CON_COUNT_ERROR',
  'ER_BAD_HOST_ERROR',
  'ER_HOST_NOT_PRIVILEGED',
  'ER_SERVER_SHUTDOWN',
]);

function walkCauses(error: unknown): unknown[] {
  const seen: unknown[] = [];
  let current: unknown = error;
  for (let i = 0; i < 6 && current; i++) {
    seen.push(current);
    if (typeof current !== 'object' || current === null) break;
    current = (current as { cause?: unknown }).cause;
  }
  return seen;
}

/** True when MySQL/network cannot be reached (no secrets in the check). */
export function isDbConnectionError(error: unknown): boolean {
  for (const node of walkCauses(error)) {
    if (typeof node !== 'object' || node === null) continue;
    const rec = node as { code?: unknown; message?: unknown };
    if (typeof rec.code === 'string' && CONNECTION_CODES.has(rec.code)) {
      return true;
    }
    if (typeof rec.message === 'string') {
      const message = rec.message.toLowerCase();
      if (
        message.includes('connect econnrefused') ||
        message.includes('connect etimedout') ||
        message.includes('getaddrinfo') ||
        message.includes('access denied for user') ||
        message.includes('unknown database')
      ) {
        return true;
      }
    }
  }
  return false;
}

export function dbErrorHttpResponse(
  error: unknown,
  fallbackMessage: string
): { error: string; status: number } {
  if (isDbConnectionError(error)) {
    return { error: 'Database unavailable', status: 503 };
  }
  return { error: fallbackMessage, status: 500 };
}
