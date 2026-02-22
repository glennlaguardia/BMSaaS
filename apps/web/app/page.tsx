import { Suspense } from 'react';
import { api } from '@/lib/api-client';
import { LandingPage } from '@/components/public/LandingPage';
import { LandingPageSkeleton } from '@/components/public/LandingPageSkeleton';
import type { Tenant, WebsiteSection, AccommodationType, Testimonial } from '@budabook/types';

export const dynamic = 'force-dynamic';

async function LandingContent() {
    // Fetch data directly from Supabase — all calls are parallel
    const [tenant, sections, types, testimonials, adjustments] = await Promise.all([
        api.getTenant().catch(() => null),
        api.getSections().catch(() => []),
        api.getAccommodationTypes().catch(() => []),
        api.getTestimonials().catch(() => []),
        api.getRateAdjustments().catch(() => []),
    ]);

    if (!tenant) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-cream-50">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-forest-700">BudaBook</h1>
                    <p className="text-forest-500/50 mt-2">Resort not found or not yet configured.</p>
                    <p className="text-sm text-forest-500/35 mt-1">
                        Check back soon or contact the resort directly.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <LandingPage
            tenant={tenant as Tenant}
            sections={sections as WebsiteSection[]}
            types={types as AccommodationType[]}
            testimonials={testimonials as Testimonial[]}
            adjustments={adjustments}
        />
    );
}

export default function HomePage() {
    return (
        <Suspense fallback={<LandingPageSkeleton />}>
            <LandingContent />
        </Suspense>
    );
}
