import mysql from 'mysql2/promise';

let pool: mysql.Pool | null = null;

export function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'jehovahs_light',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'jehovahs_light',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }
  return pool;
}

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

// Check if IP has already consented to GPS
export async function getGpsConsentByIp(ipAddress: string): Promise<GpsConsent | null> {
  const pool = getPool();
  const [rows] = await pool.execute<mysql.RowDataPacket[]>(
    `SELECT id, ip_address, consented, latitude, longitude, created_at 
     FROM gps_consent WHERE ip_address = ?`,
    [ipAddress]
  );
  return rows.length > 0 ? (rows[0] as GpsConsent) : null;
}

// Record GPS consent (and optionally location)
export async function recordGpsConsent(
  ipAddress: string,
  consented: boolean,
  latitude?: number,
  longitude?: number
): Promise<void> {
  const pool = getPool();
  await pool.execute(
    `INSERT INTO gps_consent (ip_address, consented, latitude, longitude) 
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE 
       consented = VALUES(consented),
       latitude = VALUES(latitude),
       longitude = VALUES(longitude),
       updated_at = CURRENT_TIMESTAMP`,
    [ipAddress, consented, latitude || null, longitude || null]
  );
}

// Add a new lit location with IP
export async function addLocation(
  latitude: number,
  longitude: number,
  ipAddress: string,
  userAgent?: string,
  city?: string,
  country?: string,
  countryCode?: string
): Promise<number> {
  const pool = getPool();
  const [result] = await pool.execute<mysql.ResultSetHeader>(
    `INSERT INTO lit_locations (latitude, longitude, ip_address, user_agent, city, country, country_code) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [latitude, longitude, ipAddress, userAgent || null, city || null, country || null, countryCode || null]
  );
  return result.insertId;
}

export async function getAllLocations(): Promise<LitLocation[]> {
  const pool = getPool();
  const [rows] = await pool.execute<mysql.RowDataPacket[]>(
    `SELECT id, latitude, longitude, city, country, country_code, ip_address, created_at 
     FROM lit_locations 
     ORDER BY created_at DESC`
  );
  return rows as LitLocation[];
}

export async function getStats() {
  const pool = getPool();
  
  const [totalResult] = await pool.execute<mysql.RowDataPacket[]>(
    'SELECT COUNT(*) as count FROM lit_locations'
  );
  
  const [todayResult] = await pool.execute<mysql.RowDataPacket[]>(
    'SELECT COUNT(*) as count FROM lit_locations WHERE DATE(created_at) = CURDATE()'
  );
  
  const [countriesResult] = await pool.execute<mysql.RowDataPacket[]>(
    'SELECT COUNT(DISTINCT country_code) as count FROM lit_locations WHERE country_code IS NOT NULL'
  );
  
  return {
    total: totalResult[0].count,
    today: todayResult[0].count,
    countries: countriesResult[0].count,
  };
}

export async function checkLocationExists(latitude: number, longitude: number): Promise<boolean> {
  const pool = getPool();
  // Check if a location exists within 1km radius
  const [rows] = await pool.execute<mysql.RowDataPacket[]>(
    `SELECT id FROM lit_locations 
     WHERE (6371 * acos(cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?)) + sin(radians(?)) * sin(radians(latitude)))) < 1
     LIMIT 1`,
    [latitude, longitude, latitude]
  );
  return rows.length > 0;
}
