import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { createAdminClient } from '@/lib/supabase/admin';
import type { AdminSession } from '@/types';

function getJwtSecret(): Uint8Array {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('JWT_SECRET environment variable is required in production');
        }
        console.warn('[auth] JWT_SECRET not set — using insecure dev fallback');
        return new TextEncoder().encode('budabook-dev-only-not-for-production');
    }
    return new TextEncoder().encode(secret);
}

const JWT_SECRET = getJwtSecret();
const COOKIE_NAME = 'budabook_admin_session';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

/**
 * Hash a plain-text password with bcrypt.
 */
export async function hashPassword(password: string): Promise<string> {
    const rounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10);
    return bcrypt.hash(password, rounds);
}

/**
 * Compare a plain-text password against a bcrypt hash.
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

/**
 * Create a signed JWT token for an admin session.
 */
export async function createToken(payload: AdminSession): Promise<string> {
    return new SignJWT({ ...payload })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('7d')
        .setIssuedAt()
        .sign(JWT_SECRET);
}

/**
 * Verify and decode a JWT token.
 */
export async function verifyToken(token: string): Promise<AdminSession | null> {
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        return {
            admin_user_id: payload.admin_user_id as string,
            tenant_id: payload.tenant_id as string,
            role: payload.role as string,
        };
    } catch {
        return null;
    }
}

/**
 * Set the admin session cookie (after successful login).
 */
export async function setSessionCookie(session: AdminSession): Promise<void> {
    const token = await createToken(session);
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: COOKIE_MAX_AGE,
    });
}

/**
 * Clear the admin session cookie (logout).
 */
export async function clearSessionCookie(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
    });
}

/**
 * Get the current admin session from the cookie.
 */
export async function getSession(): Promise<AdminSession | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return verifyToken(token);
}

/**
 * Get the full admin user record for the current session.
 */
export async function getAdminUser() {
    const session = await getSession();
    if (!session) return null;

    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('id', session.admin_user_id)
        .eq('is_active', true)
        .single();

    if (error || !data) return null;
    return data;
}

/**
 * Authenticate admin by username and password.
 * Returns the session payload if successful, or null.
 */
export async function authenticateAdmin(
    username: string,
    password: string
): Promise<AdminSession | null> {
    const supabase = createAdminClient();

    const { data: admin, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('username', username)
        .eq('is_active', true)
        .single();

    if (error || !admin) return null;

    const valid = await verifyPassword(password, admin.password_hash);
    if (!valid) return null;

    // Update last_login
    await supabase
        .from('admin_users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', admin.id);

    return {
        admin_user_id: admin.id,
        tenant_id: admin.tenant_id,
        role: admin.role,
    };
}
