import { NextResponse } from 'next/server';
import { inquirySchema } from '@/lib/validations';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/get-ip';

export async function POST(request: Request) {
  try {
    // Rate limit: 5 inquiry submissions per 15 minutes per IP
    const ip = getClientIp(request);
    const rl = rateLimit(ip, 'public/inquiry', { windowMs: 900_000, max: 5 });
    if (!rl.success) return rateLimitResponse(rl.resetMs);

    const body = await request.json();
    const parsed = inquirySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid form data' },
        { status: 400 }
      );
    }

    // For now, just log the inquiry. Email integration deferred.
    console.log('[Inquiry]', parsed.data);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[public/inquiry] error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
