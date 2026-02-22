import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { validateVoucherSchema } from '@/lib/validations';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/get-ip';
import { getTenantId } from '@/lib/tenant';

export async function POST(request: NextRequest) {
    try {
        // Rate limit
        const ip = getClientIp(request);
        const rl = rateLimit(ip, 'public/validate-voucher', { windowMs: 60_000, max: 30 });
        if (!rl.success) return rateLimitResponse(rl.resetMs);

        const tenantId = await getTenantId();
        if (!tenantId) {
            return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });
        }

        const body = await request.json();
        const parsed = validateVoucherSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ success: false, error: 'Invalid input', details: parsed.error.flatten().fieldErrors }, { status: 400 });
        }

        const { code, booking_type, booking_amount } = parsed.data;
        const supabase = createAdminClient();
        const today = new Date().toISOString().split('T')[0];

        const { data: voucher, error } = await supabase
            .from('vouchers')
            .select('*')
            .eq('tenant_id', tenantId)
            .eq('code', code)
            .eq('is_active', true)
            .maybeSingle();

        if (error || !voucher) {
            return NextResponse.json({ success: false, error: 'Invalid voucher code', code: 'INVALID_CODE' }, { status: 404 });
        }

        // Check date validity
        if (voucher.valid_from && today < voucher.valid_from) {
            return NextResponse.json({ success: false, error: 'Voucher is not yet active', code: 'NOT_YET_ACTIVE' }, { status: 400 });
        }
        if (voucher.valid_until && today > voucher.valid_until) {
            return NextResponse.json({ success: false, error: 'Voucher has expired', code: 'EXPIRED' }, { status: 400 });
        }

        // Check usage limit
        if (voucher.usage_limit !== null && voucher.times_used >= voucher.usage_limit) {
            return NextResponse.json({ success: false, error: 'Voucher usage limit reached', code: 'LIMIT_REACHED' }, { status: 400 });
        }

        // Check booking type applicability
        if (voucher.applies_to !== 'both' && voucher.applies_to !== booking_type) {
            return NextResponse.json({
                success: false,
                error: `Voucher is only valid for ${voucher.applies_to === 'overnight' ? 'overnight stays' : 'day tours'}`,
                code: 'WRONG_TYPE',
            }, { status: 400 });
        }

        // Check minimum booking amount
        if (voucher.min_booking_amount && booking_amount < voucher.min_booking_amount) {
            return NextResponse.json({
                success: false,
                error: `Minimum booking amount of ₱${voucher.min_booking_amount.toLocaleString()} required`,
                code: 'MIN_AMOUNT',
            }, { status: 400 });
        }

        // Calculate discount
        let discount_amount: number;
        if (voucher.discount_type === 'percentage') {
            discount_amount = (booking_amount * voucher.discount_value) / 100;
            if (voucher.max_discount && discount_amount > voucher.max_discount) {
                discount_amount = voucher.max_discount;
            }
        } else {
            discount_amount = voucher.discount_value;
        }

        // Don't exceed booking amount
        discount_amount = Math.min(discount_amount, booking_amount);
        discount_amount = Math.round(discount_amount * 100) / 100;

        return NextResponse.json({
            success: true,
            data: {
                code: voucher.code,
                description: voucher.description,
                discount_type: voucher.discount_type,
                discount_value: voucher.discount_value,
                discount_amount,
                max_discount: voucher.max_discount,
            },
        });
    } catch (error) {
        console.error('[public/validate-voucher] error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
