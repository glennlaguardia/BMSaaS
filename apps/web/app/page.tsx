import { api } from '@/lib/api-client';
import { formatPHP } from '@/lib/utils';
import Link from 'next/link';

export const revalidate = 60; // ISR: revalidate every 60 seconds

export default async function HomePage() {
    // Fetch data from SaaS API — all calls are parallel
    const [tenant, accommodationTypes, testimonials] = await Promise.all([
        api.getTenant().catch(() => null),
        api.getAccommodationTypes().catch(() => []),
        api.getTestimonials().catch(() => []),
    ]);

    if (!tenant) {
        return (
            <main className="flex min-h-screen items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900">Not Configured</h1>
                    <p className="mt-2 text-gray-600">
                        This website is not yet connected to a BudaBook tenant.
                        <br />
                        Set <code className="rounded bg-gray-100 px-1 font-mono text-sm">SAAS_API_KEY</code> in your environment.
                    </p>
                </div>
            </main>
        );
    }

    return (
        <main>
            {/* Hero Section */}
            <section className="relative flex min-h-[80vh] items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 text-white">
                <div className="absolute inset-0 bg-black/20" />
                <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
                    <h1 className="text-5xl font-bold tracking-tight sm:text-7xl">
                        {tenant.name}
                    </h1>
                    {tenant.tagline && (
                        <p className="mt-6 text-xl text-white/80 sm:text-2xl">
                            {tenant.tagline}
                        </p>
                    )}
                    <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                        <Link
                            href="/book"
                            className="rounded-lg bg-emerald-500 px-8 py-3 text-lg font-semibold shadow-lg transition hover:bg-emerald-400 hover:shadow-xl"
                        >
                            Book Now
                        </Link>
                        <a
                            href="#rooms"
                            className="rounded-lg border border-white/30 px-8 py-3 text-lg font-semibold backdrop-blur transition hover:bg-white/10"
                        >
                            View Rooms
                        </a>
                    </div>
                </div>
            </section>

            {/* Accommodation Types */}
            {accommodationTypes.length > 0 && (
                <section id="rooms" className="mx-auto max-w-7xl px-6 py-24">
                    <h2 className="text-center text-3xl font-bold text-gray-900 sm:text-4xl">
                        Our Accommodations
                    </h2>
                    <p className="mt-4 text-center text-lg text-gray-600">
                        Choose from our selection of rooms and villas
                    </p>
                    <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                        {accommodationTypes.map((type) => (
                            <div
                                key={type.id}
                                className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:shadow-lg"
                            >
                                {(type.thumbnail_url || type.images?.[0]?.url) ? (
                                    <div className="aspect-[4/3] overflow-hidden">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={type.thumbnail_url || type.images[0].url}
                                            alt={type.name}
                                            className="h-full w-full object-cover transition group-hover:scale-105"
                                        />
                                    </div>
                                ) : (
                                    <div className="flex aspect-[4/3] items-center justify-center bg-gray-100">
                                        <span className="text-4xl">🏠</span>
                                    </div>
                                )}
                                <div className="p-6">
                                    <h3 className="text-xl font-semibold text-gray-900">{type.name}</h3>
                                    {type.description && (
                                        <p className="mt-2 line-clamp-2 text-sm text-gray-600">
                                            {type.description}
                                        </p>
                                    )}
                                    <div className="mt-4 flex items-baseline gap-1">
                                        <span className="text-2xl font-bold text-emerald-600">
                                            {formatPHP(type.base_rate_weekday)}
                                        </span>
                                        <span className="text-sm text-gray-500">/ night</span>
                                    </div>
                                    <div className="mt-2 flex gap-4 text-xs text-gray-500">
                                        <span>Up to {type.base_pax} guests</span>
                                        {type.max_pax && <span>Max {type.max_pax} guests</span>}
                                    </div>
                                    <Link
                                        href={`/book?type=${type.id}`}
                                        className="mt-6 block w-full rounded-lg bg-emerald-500 py-2.5 text-center font-medium text-white transition hover:bg-emerald-400"
                                    >
                                        Check Availability
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Testimonials */}
            {testimonials.length > 0 && (
                <section className="bg-gray-50 py-24">
                    <div className="mx-auto max-w-5xl px-6">
                        <h2 className="text-center text-3xl font-bold text-gray-900 sm:text-4xl">
                            What Our Guests Say
                        </h2>
                        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                            {testimonials.slice(0, 6).map((t) => (
                                <blockquote
                                    key={t.id}
                                    className="rounded-2xl bg-white p-6 shadow-sm"
                                >
                                    {t.rating && (
                                        <div className="mb-3 text-amber-400">
                                            {'★'.repeat(t.rating)}{'☆'.repeat(5 - t.rating)}
                                        </div>
                                    )}
                                    <p className="text-sm leading-relaxed text-gray-700">
                                        &ldquo;{t.content}&rdquo;
                                    </p>
                                    <footer className="mt-4 text-sm font-medium text-gray-900">
                                        — {t.guest_name}
                                    </footer>
                                </blockquote>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Footer */}
            <footer className="border-t border-gray-200 py-12">
                <div className="mx-auto max-w-7xl px-6 text-center">
                    <p className="text-sm text-gray-500">
                        &copy; {new Date().getFullYear()} {tenant.name}. All rights reserved.
                    </p>
                    <p className="mt-2 text-xs text-gray-400">
                        Powered by{' '}
                        <span className="font-medium text-gray-500">SAMAHAN Systems Development</span>
                    </p>
                </div>
            </footer>
        </main>
    );
}
