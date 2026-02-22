import { NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/auth';

export async function GET() {
  try {
    const admin = await getAdminUser();

    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // password_hash is never selected by getAdminUser(), safe to return directly
    return NextResponse.json({ success: true, data: admin });
  } catch (error) {
    console.error('[auth/me] error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
