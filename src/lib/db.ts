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
  created_at: Date;
}

export async function addLocation(
  latitude: number,
  longitude: number,
  city?: string,
  country?: string,
  countryCode?: string
): Promise<number> {
  const pool = getPool();
  const [result] = await pool.execute<mysql.ResultSetHeader>(
    `INSERT INTO lit_locations (latitude, longitude, city, country, country_code) 
     VALUES (?, ?, ?, ?, ?)`,
    [latitude, longitude, city || null, country || null, countryCode || null]
  );
  return result.insertId;
}

export async function getAllLocations(): Promise<LitLocation[]> {
  const pool = getPool();
  const [rows] = await pool.execute<mysql.RowDataPacket[]>(
    `SELECT id, latitude, longitude, city, country, country_code, created_at 
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
