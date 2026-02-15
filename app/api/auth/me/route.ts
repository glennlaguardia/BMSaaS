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

    // Don't return the password hash
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password_hash, ...safeAdmin } = admin;
    return NextResponse.json({ success: true, data: safeAdmin });
  } catch (error) {
    console.error('[auth/me] error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
