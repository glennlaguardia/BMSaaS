import { NextResponse } from 'next/server';
import { authenticateAdmin, setSessionCookie } from '@/lib/auth';
import { loginSchema } from '@/lib/validations';

export async function POST(request: Request) {
  try {
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
  } catch {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
