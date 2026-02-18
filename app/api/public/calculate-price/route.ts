import { NextRequest, NextResponse } from 'next/server';
import { getTenantId } from '@/lib/tenant';
import { createAdminClient } from '@/lib/supabase/admin';
import { calculatePrice } from '@/lib/pricing';
import { calculatePriceSchema } from '@/lib/validations';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/get-ip';
import type { AccommodationType, RateAdjustment, Addon } from '@/types';

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 60 price calculations per minute per IP
    const ip = getClientIp(request);
    const rl = rateLimit(ip, 'public/calculate-price', { windowMs: 60_000, max: 60 });
    if (!rl.success) return rateLimitResponse(rl.resetMs);

    const tenantId = await getTenantId();
    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });
    }

    const body = await request.json();
    const parsed = calculatePriceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid input' }, { status: 400 });
    }

    const { accommodation_type_id, check_in_date, check_out_date, num_adults, num_children, addon_ids, addon_quantities } = parsed.data;

    const supabase = createAdminClient();

    // Fetch accommodation type (scoped to tenant for security)
    const { data: typeData } = await supabase
      .from('accommodation_types')
      .select('*')
      .eq('id', accommodation_type_id)
      .eq('tenant_id', tenantId)
      .single();

    if (!typeData) {
      return NextResponse.json({ success: false, error: 'Accommodation type not found' }, { status: 404 });
    }

    // Fetch rate adjustments
    const { data: adjustments } = await supabase
      .from('rate_adjustments')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .lte('start_date', check_out_date)
      .gte('end_date', check_in_date);

    // Fetch addons if selected
    let selectedAddons: { addon: Addon; quantity: number }[] = [];
    if (addon_ids && addon_ids.length > 0) {
      const { data: addonsData } = await supabase
        .from('addons')
        .select('*')
        .in('id', addon_ids)
        .eq('tenant_id', tenantId);

      if (addonsData) {
        selectedAddons = addonsData.map((addon, i) => ({
          addon: addon as Addon,
          quantity: addon_quantities?.[i] || 1,
        }));
      }
    }

    const priceCalc = calculatePrice(
      check_in_date,
      check_out_date,
      num_adults,
      num_children,
      typeData as AccommodationType,
      (adjustments || []) as RateAdjustment[],
      selectedAddons
    );

    return NextResponse.json({ success: true, data: priceCalc });
  } catch (error) {
    console.error('[calculate-price] POST error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
