import { NextRequest, NextResponse } from 'next/server';
import { 
  getAllLocations, 
  getStats, 
  addLocation, 
  getLampByVisitor,
  recordGpsConsent,
  dbErrorHttpResponse,
  isDuplicateKeyError,
  type VisitorLamp,
} from '@/lib/db';
import { toJsonSafe } from '@/lib/json-safe';
import { isValidVisitorId } from '@/lib/visitor-id';

function alreadyLitResponse(lamp: VisitorLamp) {
  return NextResponse.json(toJsonSafe({
    message: 'Location already lit',
    alreadyExists: true,
    location: {
      latitude: lamp.latitude,
      longitude: lamp.longitude,
      city: lamp.city ?? undefined,
      country: lamp.country ?? undefined,
      country_code: lamp.country_code ?? undefined,
    },
  }));
}

// Get client IP from request headers (Cloudflare sends CF-Connecting-IP)
function getClientIp(request: NextRequest): string {
  return request.headers.get('cf-connecting-ip') || 
         request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
         request.headers.get('x-real-ip') ||
         'unknown';
}

// GET /api/locations - Get all locations and stats.
// No per-IP consent here: a shared IP (home Wi-Fi, carrier NAT, iCloud Private
// Relay) would mark strangers as lit and leak the other visitor's coordinates.
export async function GET() {
  try {
    const [locations, stats] = await Promise.all([getAllLocations(), getStats()]);

    return NextResponse.json(toJsonSafe({ locations, stats }));
  } catch (error) {
    console.error('Error fetching locations:', error);
    const { error: message, status } = dbErrorHttpResponse(
      error,
      'Failed to fetch locations'
    );
    return NextResponse.json({ error: message }, { status });
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
    // Optional so a stale cached client still lights a lamp (as an anonymous row).
    const visitorId = isValidVisitorId(body.visitorId) ? body.visitorId : undefined;

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

    // One lamp per person: nearby lamps are merged on the globe, not here.
    if (visitorId) {
      const existing = await getLampByVisitor(visitorId);
      if (existing) return alreadyLitResponse(existing);
    }

    const geoData = await getGeoLocation(latitude, longitude);

    let id: number;
    try {
      id = await addLocation(
        latitude,
        longitude,
        clientIp,
        userAgent,
        geoData.city,
        geoData.country,
        geoData.country_code,
        visitorId
      );
    } catch (error) {
      // Double tap: a parallel request from the same browser won the insert.
      if (visitorId && isDuplicateKeyError(error)) {
        const existing = await getLampByVisitor(visitorId);
        if (existing) return alreadyLitResponse(existing);
      }
      throw error;
    }

    return NextResponse.json(toJsonSafe({
      success: true,
      id,
      location: {
        latitude,
        longitude,
        ...geoData,
      },
    }));
  } catch (error) {
    console.error('Error adding location:', error);
    const { error: message, status } = dbErrorHttpResponse(
      error,
      'Failed to add location'
    );
    return NextResponse.json({ error: message }, { status });
  }
}
