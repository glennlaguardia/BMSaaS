'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useParams } from 'next/navigation';
import { BookingWizard } from '@/components/booking/BookingWizard';
import { DayTourWizard } from '@/components/booking/DayTourWizard';
import { cn } from '@/lib/utils';
import { Bed, Sun } from 'lucide-react';
import type { Tenant, AccommodationType, Addon } from '@/types';

export default function BookingPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-cream-50">
                <div className="text-center">
                    <div className="w-8 h-8 border-2 border-forest-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-sm text-forest-500/45 mt-3">Loading booking...</p>
                </div>
            </div>
        }>
            <BookingPageContent />
        </Suspense>
    );
}

function BookingPageContent() {
    const params = useParams<{ tenant: string }>();
    const searchParams = useSearchParams();
    const tenantSlug = params.tenant;
    const returnUrl = searchParams.get('return_url') || '';

    const [tenant, setTenant] = useState<Tenant | null>(null);
    const [types, setTypes] = useState<AccommodationType[]>([]);
    const [overnightAddons, setOvernightAddons] = useState<Addon[]>([]);
    const [dayTourAddons, setDayTourAddons] = useState<Addon[]>([]);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [bookingType, setBookingType] = useState<'overnight' | 'day_tour'>('overnight');

    useEffect(() => {
        if (!tenantSlug) {
            setNotFound(true);
            setLoading(false);
            return;
        }

        // Pass tenant slug as query param — getTenantSlug() picks it up
        const qs = `?tenant=${encodeURIComponent(tenantSlug)}`;

        Promise.all([
            fetch(`/api/public/tenant${qs}`).then(r => r.json()),
            fetch(`/api/public/accommodation-types${qs}`).then(r => r.json()),
            fetch(`/api/public/addons${qs}&applies_to=overnight`).then(r => r.json()),
            fetch(`/api/public/addons${qs}&applies_to=day_tour`).then(r => r.json()),
        ])
            .then(([tenantRes, typesRes, overnightRes, dayTourRes]) => {
                if (tenantRes.success) {
                    setTenant(tenantRes.data);
                } else {
                    setNotFound(true);
                }
                if (typesRes.success) setTypes(typesRes.data);
                if (overnightRes.success) setOvernightAddons(overnightRes.data);
                if (dayTourRes.success) setDayTourAddons(dayTourRes.data);
            })
            .catch(() => setNotFound(true))
            .finally(() => setLoading(false));
    }, [tenantSlug]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-cream-50">
                <div className="text-center">
                    <div className="w-8 h-8 border-2 border-forest-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-sm text-forest-500/45 mt-3">Loading booking...</p>
                </div>
            </div>
        );
    }

    if (notFound || !tenant) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-cream-50">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-forest-700">Resort Not Found</h1>
                    <p className="text-forest-500/50 mt-2">
                        The resort &ldquo;{tenantSlug}&rdquo; could not be found.
                    </p>
                    <p className="text-sm text-forest-500/35 mt-1">
                        Please check the URL and try again.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-cream-50">
            {/* Booking Type Toggle */}
            <div className="max-w-7xl mx-auto px-4 pt-8">
                <div className="flex items-center justify-center gap-2 mb-2">
                    <button
                        onClick={() => setBookingType('overnight')}
                        className={cn(
                            'flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300',
                            bookingType === 'overnight'
                                ? 'bg-forest-500 text-white shadow-sm'
                                : 'bg-white text-forest-500/60 border border-forest-100/30 hover:border-forest-500/20'
                        )}
                    >
                        <Bed className="w-4 h-4" />
                        Overnight Stay
                    </button>
                    <button
                        onClick={() => setBookingType('day_tour')}
                        className={cn(
                            'flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300',
                            bookingType === 'day_tour'
                                ? 'bg-forest-500 text-white shadow-sm'
                                : 'bg-white text-forest-500/60 border border-forest-100/30 hover:border-forest-500/20'
                        )}
                    >
                        <Sun className="w-4 h-4" />
                        Day Tour / Walk-in
                    </button>
                </div>
            </div>

            {bookingType === 'overnight' ? (
                <BookingWizard
                    tenant={tenant}
                    accommodationTypes={types}
                    addons={overnightAddons}
                    returnUrl={returnUrl}
                    prefill={{
                        checkIn: searchParams.get('checkIn') || '',
                        checkOut: searchParams.get('checkOut') || '',
                        firstName: searchParams.get('firstName') || '',
                        lastName: searchParams.get('lastName') || '',
                        email: searchParams.get('email') || '',
                        phone: searchParams.get('phone') || '',
                        numAdults: parseInt(searchParams.get('numAdults') || '0') || 0,
                        numChildren: parseInt(searchParams.get('numChildren') || '0') || 0,
                    }}
                />
            ) : (
                <DayTourWizard
                    tenant={tenant}
                    addons={dayTourAddons}
                    returnUrl={returnUrl}
                />
            )}
        </div>
    );
}
