import { count, countDistinct, desc, eq, sql } from 'drizzle-orm';
import { toJsonNumber } from '../json-safe';
import { getDb } from './client';
import { gpsConsent, litLocations } from './schema';

export { getDb, getPool } from './client';
export { isDbConnectionError, dbErrorHttpResponse } from './errors';
export { gpsConsent, litLocations } from './schema';

export interface LitLocation {
  id: number;
  latitude: number;
  longitude: number;
  city: string | null;
  country: string | null;
  country_code: string | null;
  ip_address: string | null;
  created_at: Date;
}

export interface GpsConsent {
  id: number;
  ip_address: string;
  consented: boolean;
  latitude: number | null;
  longitude: number | null;
  created_at: Date;
}

function toCoord(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function toCoordRequired(value: unknown): number {
  return toCoord(value) ?? 0;
}

export async function getGpsConsentByIp(ipAddress: string): Promise<GpsConsent | null> {
  const db = getDb();
  const rows = await db
    .select({
      id: gpsConsent.id,
      ip_address: gpsConsent.ipAddress,
      consented: gpsConsent.consented,
      latitude: gpsConsent.latitude,
      longitude: gpsConsent.longitude,
      created_at: gpsConsent.createdAt,
    })
    .from(gpsConsent)
    .where(eq(gpsConsent.ipAddress, ipAddress))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  return {
    id: toJsonNumber(row.id),
    ip_address: row.ip_address,
    consented: Boolean(row.consented),
    latitude: toCoord(row.latitude),
    longitude: toCoord(row.longitude),
    created_at: row.created_at,
  };
}

export async function recordGpsConsent(
  ipAddress: string,
  consented: boolean,
  latitude?: number,
  longitude?: number
): Promise<void> {
  const db = getDb();
  const lat = latitude || null;
  const lng = longitude || null;
  await db
    .insert(gpsConsent)
    .values({
      ipAddress,
      consented,
      latitude: lat,
      longitude: lng,
    })
    .onDuplicateKeyUpdate({
      set: {
        consented,
        latitude: lat,
        longitude: lng,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      },
    });
}

export async function addLocation(
  latitude: number,
  longitude: number,
  ipAddress: string,
  userAgent?: string,
  city?: string,
  country?: string,
  countryCode?: string
): Promise<number> {
  const db = getDb();
  const result = await db.insert(litLocations).values({
    latitude,
    longitude,
    ipAddress,
    userAgent: userAgent || null,
    city: city || null,
    country: country || null,
    countryCode: countryCode || null,
  });
  return toJsonNumber(result[0].insertId);
}

export async function getAllLocations(): Promise<LitLocation[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: litLocations.id,
      latitude: litLocations.latitude,
      longitude: litLocations.longitude,
      city: litLocations.city,
      country: litLocations.country,
      country_code: litLocations.countryCode,
      ip_address: litLocations.ipAddress,
      created_at: litLocations.createdAt,
    })
    .from(litLocations)
    .orderBy(desc(litLocations.createdAt));

  return rows.map((row) => ({
    id: toJsonNumber(row.id),
    latitude: toCoordRequired(row.latitude),
    longitude: toCoordRequired(row.longitude),
    city: row.city,
    country: row.country,
    country_code: row.country_code,
    ip_address: row.ip_address,
    created_at: row.created_at,
  }));
}

export async function getStats() {
  const db = getDb();

  const [totalResult] = await db.select({ count: count() }).from(litLocations);

  const [todayResult] = await db
    .select({ count: count() })
    .from(litLocations)
    .where(sql`DATE(${litLocations.createdAt}) = CURDATE()`);

  const [countriesResult] = await db
    .select({ count: countDistinct(litLocations.countryCode) })
    .from(litLocations)
    .where(sql`${litLocations.countryCode} IS NOT NULL`);

  return {
    total: toJsonNumber(totalResult?.count),
    today: toJsonNumber(todayResult?.count),
    countries: toJsonNumber(countriesResult?.count),
  };
}

export async function checkLocationExists(latitude: number, longitude: number): Promise<boolean> {
  const db = getDb();
  const rows = await db
    .select({ id: litLocations.id })
    .from(litLocations)
    .where(
      sql`(6371 * acos(cos(radians(${latitude})) * cos(radians(${litLocations.latitude})) * cos(radians(${litLocations.longitude}) - radians(${longitude})) + sin(radians(${latitude})) * sin(radians(${litLocations.latitude})))) < 1`
    )
    .limit(1);
  return rows.length > 0;
}
