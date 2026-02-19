import { redirect } from 'next/navigation';

/**
 * SaaS root — redirects to the admin dashboard login.
 * All public-facing pages live in the client website (apps/web).
 */
export default function RootPage() {
    redirect('/dashboard');
}
