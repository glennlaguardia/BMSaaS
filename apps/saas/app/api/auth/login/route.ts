import { NextResponse } from 'next/server';
import { authenticateAdmin, setSessionCookie } from '@/lib/auth';
import { loginSchema } from '@/lib/validations';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/get-ip';

export async function POST(request: Request) {
    try {
        // Rate limit: 5 login attempts per 15 minutes per IP (brute-force protection)
        const ip = getClientIp(request);
        const rl = rateLimit(ip, 'auth/login', { windowMs: 900_000, max: 5 });
        if (!rl.success) return rateLimitResponse(rl.resetMs);
        const body = await request.json();
        const parsed = loginSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { success: false, error: 'Username and password are required' },
                { status: 400 }
            );
        }

        const { username, password } = parsed.data;
        const session = await authenticateAdmin(username, password);

        if (!session) {
            return NextResponse.json(
                { success: false, error: 'Invalid username or password' },
                { status: 401 }
            );
        }

        await setSessionCookie(session);

        return NextResponse.json({
            success: true,
            data: {
                admin_user_id: session.admin_user_id,
                tenant_id: session.tenant_id,
                role: session.role,
            },
        });
    } catch (error) {
        console.error('[auth/login] error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
