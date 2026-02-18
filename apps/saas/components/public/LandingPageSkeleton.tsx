'use client';

import { cn } from '@/lib/utils';

function Pulse({ className }: { className?: string }) {
    return (
        <div className={cn('animate-pulse rounded-lg bg-forest-100/60', className)} />
    );
}

/** Full-page skeleton shown while the landing page data loads */
export function LandingPageSkeleton() {
    return (
        <div className="min-h-screen">
            {/* Hero skeleton */}
            <section className="relative min-h-screen flex items-center justify-center bg-forest-50">
                <div className="absolute inset-0 animate-pulse bg-gradient-to-b from-forest-100/30 via-forest-50/50 to-cream-100" />
                <div className="relative z-10 text-center px-4 space-y-6 max-w-2xl mx-auto">
                    <Pulse className="h-5 w-32 mx-auto bg-forest-200/40" />
                    <Pulse className="h-14 w-full max-w-xl mx-auto" />
                    <Pulse className="h-5 w-64 mx-auto bg-forest-100/50" />
                    <Pulse className="h-12 w-48 mx-auto mt-4 rounded-full" />
                </div>
            </section>

            {/* About skeleton */}
            <section className="py-20 md:py-28 bg-cream-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div className="space-y-4">
                            <Pulse className="h-4 w-20" />
                            <Pulse className="h-10 w-3/4" />
                            <Pulse className="h-4 w-full mt-6" />
                            <Pulse className="h-4 w-5/6" />
                            <Pulse className="h-4 w-4/5" />
                            <Pulse className="h-4 w-full" />
                            <Pulse className="h-4 w-3/4" />
                        </div>
                        <Pulse className="h-[400px] rounded-2xl" />
                    </div>
                    <div className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-8">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="text-center space-y-2">
                                <Pulse className="h-10 w-28 mx-auto" />
                                <Pulse className="h-3 w-20 mx-auto" />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Accommodations skeleton */}
            <section className="py-20 md:py-28 bg-white">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-14 space-y-3">
                        <Pulse className="h-4 w-28 mx-auto" />
                        <Pulse className="h-10 w-72 mx-auto" />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-6 lg:gap-8">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="rounded-2xl overflow-hidden border border-cream-300/50">
                                <Pulse className="h-64 rounded-none" />
                                <div className="p-6 space-y-3">
                                    <Pulse className="h-6 w-40" />
                                    <Pulse className="h-4 w-full" />
                                    <Pulse className="h-4 w-3/4" />
                                    <div className="flex justify-between items-end mt-4">
                                        <Pulse className="h-8 w-28" />
                                        <Pulse className="h-9 w-24 rounded-full" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Activities skeleton */}
            <section className="py-24 md:py-32 bg-primary">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16 space-y-3">
                        <Pulse className="h-4 w-24 mx-auto bg-white/10" />
                        <Pulse className="h-10 w-64 mx-auto bg-white/10" />
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <Pulse key={i} className="h-40 rounded-2xl bg-white/8" />
                        ))}
                    </div>
                </div>
            </section>

            {/* Gallery skeleton */}
            <section className="py-20 md:py-28 bg-cream-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-14 space-y-3">
                        <Pulse className="h-4 w-16 mx-auto" />
                        <Pulse className="h-10 w-64 mx-auto" />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <Pulse key={i} className={cn('rounded-xl', i % 3 === 0 ? 'h-64' : 'h-48')} />
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}

/** Section-level skeleton for individual components */
export function SectionSkeleton({ dark = false, className }: { dark?: boolean; className?: string }) {
    return (
        <section className={cn('py-20 md:py-28', dark ? 'bg-primary' : 'bg-cream-100', className)}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-14 space-y-3">
                    <Pulse className={cn('h-4 w-24 mx-auto', dark ? 'bg-white/10' : '')} />
                    <Pulse className={cn('h-10 w-64 mx-auto', dark ? 'bg-white/10' : '')} />
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Pulse key={i} className={cn('h-48 rounded-xl', dark ? 'bg-white/8' : '')} />
                    ))}
                </div>
            </div>
        </section>
    );
}
