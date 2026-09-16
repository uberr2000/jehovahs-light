/** Make mysql2 BIGINT / mixed rows safe for NextResponse.json(). */
export function toJsonSafe<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_key, item) => (typeof item === 'bigint' ? Number(item) : item))
  ) as T;
}

export function toJsonNumber(value: unknown): number {
  if (typeof value === 'bigint' || typeof value === 'number') {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}
