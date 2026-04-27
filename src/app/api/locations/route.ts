import { NextRequest, NextResponse } from 'next/server';
import { 
  getAllLocations, 
  getStats, 
  addLocation, 
  checkLocationExists,
  getGpsConsentByIp,
  recordGpsConsent
} from '@/lib/db';

// Get client IP from request headers (Cloudflare sends CF-Connecting-IP)
function getClientIp(request: NextRequest): string {
  return request.headers.get('cf-connecting-ip') || 
         request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
         request.headers.get('x-real-ip') ||
         'unknown';
}

// GET /api/locations - Get all locations and stats, plus user's GPS consent status
export async function GET(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    
    const [locations, stats, consent] = await Promise.all([
      getAllLocations(),
      getStats(),
      getGpsConsentByIp(clientIp),
    ]);

    return NextResponse.json({
      locations,
      stats,
      userConsent: consent ? {
        consented: consent.consented,
        hasLocation: consent.latitude !== null && consent.longitude !== null,
        latitude: consent.latitude,
        longitude: consent.longitude,
      } : null,
    });
  } catch (error) {
    console.error('Error fetching locations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch locations' },
      { status: 500 }
    );
  }
}

interface GeoLocationResponse {
  city?: string;
  country?: string;
  country_code?: string;
}

async function getGeoLocation(lat: number, lng: number): Promise<GeoLocationResponse> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`,
      {
        headers: {
          'User-Agent': 'JehovahsLight/1.0',
        },
      }
    );
    const data = await response.json();
    return {
      city: data.address?.city || data.address?.town || data.address?.village,
      country: data.address?.country,
      country_code: data.address?.country_code?.toUpperCase(),
    };
  } catch {
    return {};
  }
}

// POST /api/locations - Add a new lit location
export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    const userAgent = request.headers.get('user-agent') || undefined;
    const body = await request.json();
    const { latitude, longitude } = body;

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return NextResponse.json(
        { error: 'Invalid coordinates' },
        { status: 400 }
      );
    }

    // Validate coordinate ranges
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return NextResponse.json(
        { error: 'Coordinates out of range' },
        { status: 400 }
      );
    }

    // Record consent with location
    await recordGpsConsent(clientIp, true, latitude, longitude);

    // Check if location already exists within 1km
    const exists = await checkLocationExists(latitude, longitude);
    if (exists) {
      return NextResponse.json(
        { message: 'Location already lit', alreadyExists: true },
        { status: 200 }
      );
    }

    // Get geo location data
    const geoData = await getGeoLocation(latitude, longitude);

    // Add to database
    const id = await addLocation(
      latitude,
      longitude,
      clientIp,
      userAgent,
      geoData.city,
      geoData.country,
      geoData.country_code
    );

    return NextResponse.json({
      success: true,
      id,
      location: {
        latitude,
        longitude,
        ...geoData,
      },
    });
  } catch (error) {
    console.error('Error adding location:', error);
    return NextResponse.json(
      { error: 'Failed to add location' },
      { status: 500 }
    );
  }
}
