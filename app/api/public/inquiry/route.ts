import { NextResponse } from 'next/server';
import { inquirySchema } from '@/lib/validations';

export async function POST(request: Request) {
  try {
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
  } catch {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
