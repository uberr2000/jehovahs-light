import { NextRequest, NextResponse } from 'next/server';
import { recordGpsConsent } from '@/lib/db';

// Get client IP from request headers
function getClientIp(request: NextRequest): string {
  return request.headers.get('cf-connecting-ip') || 
         request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
         request.headers.get('x-real-ip') ||
         'unknown';
}

// POST /api/consent - Record GPS consent (accepted or declined)
export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    const body = await request.json();
    const { consented, latitude, longitude } = body;

    await recordGpsConsent(
      clientIp, 
      Boolean(consented),
      latitude,
      longitude
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error recording consent:', error);
    return NextResponse.json(
      { error: 'Failed to record consent' },
      { status: 500 }
    );
  }
}
