import {
  boolean,
  double,
  int,
  mysqlTable,
  timestamp,
  varchar,
} from 'drizzle-orm/mysql-core';

/** Existing table `lit_locations` — column names match src/lib/db.ts SQL. */
export const litLocations = mysqlTable('lit_locations', {
  id: int('id', { unsigned: true }).primaryKey().autoincrement(),
  latitude: double('latitude').notNull(),
  longitude: double('longitude').notNull(),
  city: varchar('city', { length: 255 }),
  country: varchar('country', { length: 255 }),
  countryCode: varchar('country_code', { length: 8 }),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: varchar('user_agent', { length: 1024 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/** Existing table `gps_consent` — `ip_address` is UNIQUE. */
export const gpsConsent = mysqlTable('gps_consent', {
  id: int('id', { unsigned: true }).primaryKey().autoincrement(),
  ipAddress: varchar('ip_address', { length: 45 }).notNull().unique(),
  consented: boolean('consented').notNull(),
  latitude: double('latitude'),
  longitude: double('longitude'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});
