import { NextResponse } from 'next/server';
import { getAllLocations, getStats } from '@/lib/db';

export async function GET() {
  try {
    const [locations, stats] = await Promise.all([
      getAllLocations(),
      getStats(),
    ]);

    return NextResponse.json({
      locations,
      stats,
    });
  } catch (error) {
    console.error('Error fetching locations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch locations' },
      { status: 500 }
    );
  }
}

import { NextRequest } from 'next/server';
import { addLocation, checkLocationExists } from '@/lib/db';

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

export async function POST(request: NextRequest) {
  try {
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
