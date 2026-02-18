import { NextResponse } from 'next/server';
import { createV1Handler } from '@/lib/v1-handler';
import { inquirySchema } from '@/lib/validations';

export const POST = createV1Handler(
    { endpoint: 'v1/inquiries', scope: 'write:inquiries', rateMax: 5, rateWindowMs: 900_000 },
    async ({ request }) => {
        const body = await request.json();
        const parsed = inquirySchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { success: false, error: 'Invalid form data', code: 'VALIDATION_ERROR' },
                { status: 400 }
            );
        }

        // For now, log the inquiry. Email integration can be added later.
        console.log('[v1/inquiries]', parsed.data);

        return NextResponse.json({ success: true });
    }
);

export const OPTIONS = createV1Handler(
    { endpoint: 'v1/inquiries' },
    async () => new NextResponse(null, { status: 204 })
);
