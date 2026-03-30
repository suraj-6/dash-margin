import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: Date.now(),
    service: 'margins-api',
    version: '1.0.0'
  });
}
