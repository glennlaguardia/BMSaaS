/**
 * Typed API client for consuming the BudaBook SaaS v1 API.
 *
 * All requests include the `X-API-Key` header for authentication.
 * The base URL and API key are read from server-side env vars so they
 * are never exposed to the browser.
 *
 * Usage (in a Server Component or Route Handler):
 *   const tenant = await api.getTenant();
 *   const rooms = await api.getRooms({ type_id: '...' });
 */

import type {
    Tenant,
    WebsiteSection,
    AccommodationType,
    Room,
    Addon,
    Testimonial,
    RateAdjustment,
} from '@budabook/types';

// ── Config ──────────────────────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_SAAS_API_URL || 'http://localhost:3000/api/v1';
const API_KEY = process.env.SAAS_API_KEY || '';

// ── Types ───────────────────────────────────────────────────────────

interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    code?: string;
}

interface AvailabilityDay {
    total_rooms: number;
    booked_rooms: number;
    status: 'available' | 'limited' | 'full';
}

interface PriceResult {
    nights: Array<{
        date: string;
        dayOfWeek: number;
        isWeekend: boolean;
        baseRate: number;
        adjustmentName: string | null;
        adjustmentAmount: number;
        effectiveRate: number;
    }>;
    totalNights: number;
    totalBaseRate: number;
    extraPax: number;
    paxSurchargePerNight: number;
    totalPaxSurcharge: number;
    addonsTotal: number;
    grandTotal: number;
}

// ── Fetch helper ────────────────────────────────────────────────────

async function apiFetch<T>(
    path: string,
    options: RequestInit = {}
): Promise<T> {
    const url = `${API_BASE}${path}`;

    const res = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'X-API-Key': API_KEY,
            ...options.headers,
        },
        // Next.js fetch caching — revalidate every 60s by default
        next: { revalidate: 60, ...((options as { next?: object }).next || {}) },
    } as RequestInit);

    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const message = (body as ApiResponse<unknown>).error || `API error ${res.status}`;
        throw new Error(message);
    }

    const json = (await res.json()) as ApiResponse<T>;
    if (!json.success || !json.data) {
        throw new Error(json.error || 'API returned unsuccessful response');
    }

    return json.data;
}

// ── API methods ─────────────────────────────────────────────────────

export const api = {
    /** Fetch tenant details */
    getTenant(): Promise<Tenant> {
        return apiFetch<Tenant>('/tenant');
    },

    /** Fetch visible website sections */
    getSections(): Promise<WebsiteSection[]> {
        return apiFetch<WebsiteSection[]>('/sections');
    },

    /** Fetch active accommodation types */
    getAccommodationTypes(): Promise<AccommodationType[]> {
        return apiFetch<AccommodationType[]>('/accommodation-types');
    },

    /** Fetch rooms, optionally filtered by type */
    getRooms(params?: { type_id?: string }): Promise<Room[]> {
        const qs = params?.type_id ? `?type_id=${params.type_id}` : '';
        return apiFetch<Room[]>(`/rooms${qs}`);
    },

    /** Fetch active addons */
    getAddons(): Promise<Addon[]> {
        return apiFetch<Addon[]>('/addons');
    },

    /** Fetch featured testimonials */
    getTestimonials(): Promise<Testimonial[]> {
        return apiFetch<Testimonial[]>('/testimonials');
    },

    /** Fetch currently active rate adjustments */
    getRateAdjustments(): Promise<RateAdjustment[]> {
        return apiFetch<RateAdjustment[]>('/rate-adjustments');
    },

    /** Fetch availability for a date range */
    getAvailability(params: {
        start_date: string;
        end_date: string;
        type_id?: string;
    }): Promise<Record<string, AvailabilityDay>> {
        const qs = new URLSearchParams({
            start_date: params.start_date,
            end_date: params.end_date,
            ...(params.type_id ? { type_id: params.type_id } : {}),
        });
        return apiFetch<Record<string, AvailabilityDay>>(`/availability?${qs.toString()}`);
    },

    /** Calculate price for a booking */
    calculatePrice(body: {
        check_in_date: string;
        check_out_date: string;
        num_adults: number;
        num_children: number;
        accommodation_type_id: string;
        addon_ids?: string[];
        addon_quantities?: number[];
    }): Promise<PriceResult> {
        return apiFetch<PriceResult>('/calculate-price', {
            method: 'POST',
            body: JSON.stringify(body),
            next: { revalidate: 0 }, // Never cache price calculations
        });
    },

    /** Submit an inquiry */
    submitInquiry(body: {
        name: string;
        email: string;
        phone?: string;
        message: string;
    }): Promise<{ id: string }> {
        return apiFetch<{ id: string }>('/inquiries', {
            method: 'POST',
            body: JSON.stringify(body),
            next: { revalidate: 0 },
        });
    },
};
