import { NextRequest, NextResponse } from 'next/server';
import { getTenant } from '@/lib/tenant';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/get-ip';

export async function GET(request: NextRequest) {
  try {
    // Rate limit: 120 requests per minute per IP
    const ip = getClientIp(request);
    const rl = rateLimit(ip, 'public/tenant', { windowMs: 60_000, max: 120 });
    if (!rl.success) return rateLimitResponse(rl.resetMs);

    const tenant = await getTenant();
    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'Tenant not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: tenant });
  } catch (error) {
    console.error('[public/tenant] error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
