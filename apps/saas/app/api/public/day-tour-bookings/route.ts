import { NextRequest, NextResponse } from 'next/server';
import { getTenantId } from '@/lib/tenant';
import { createAdminClient } from '@/lib/supabase/admin';
import { createDayTourBookingSchema } from '@/lib/validations';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/get-ip';

interface DayTourRpcResult {
  success: boolean;
  error?: string;
  booking_id?: string;
  reference_number?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 10 day-tour booking requests per hour per IP
    const ip = getClientIp(request);
    const rl = rateLimit(ip, 'public/day-tour-bookings', { windowMs: 3_600_000, max: 10 });
    if (!rl.success) return rateLimitResponse(rl.resetMs);

    const tenantId = await getTenantId();
    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });
    }

    const body = await request.json();
    const parsed = createDayTourBookingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid booking data', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const supabase = createAdminClient();

    // Fetch tenant day tour rates to calculate base amount server-side
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('day_tour_rate_adult, day_tour_rate_child')
      .eq('id', tenantId)
      .single();

    if (tenantError || !tenant) {
      console.error('[day-tour-bookings] tenant fetch error:', tenantError);
      return NextResponse.json(
        { success: false, error: 'Failed to load tenant configuration' },
        { status: 500 }
      );
    }

    const totalPax = data.num_adults + data.num_children;

    // Base amount from tenant-configured day tour rates
    const baseAmount =
      data.num_adults * Number(tenant.day_tour_rate_adult ?? 0) +
      data.num_children * Number(tenant.day_tour_rate_child ?? 0);

    // Resolve add-ons and compute quantities/prices for DB function
    const addonIds = data.addon_ids ?? [];
    const addonQuantitiesClient = data.addon_quantities ?? [];

    let addonsAmount = 0;
    const addonIdsDb: string[] = [];
    const addonQuantitiesDb: number[] = [];
    const addonPricesDb: number[] = [];

    if (addonIds.length > 0) {
      const { data: addons, error: addonsError } = await supabase
        .from('addons')
        .select('id, price, pricing_model')
        .in('id', addonIds)
        .eq('tenant_id', tenantId);

      if (addonsError) {
        console.error('[day-tour-bookings] addons fetch error:', addonsError);
        return NextResponse.json(
          { success: false, error: 'Failed to load day tour add-ons' },
          { status: 400 }
        );
      }

      const addonMap = new Map<string, { price: number; pricing_model: string }>();
      for (const a of addons ?? []) {
        addonMap.set(a.id as string, {
          price: Number(a.price ?? 0),
          pricing_model: a.pricing_model as string,
        });
      }

      addonIds.forEach((id, index) => {
        const addon = addonMap.get(id);
        if (!addon) return;

        const baseQty = addonQuantitiesClient[index] ?? 1;
        let quantityForDb = baseQty;
        const unitPrice = addon.price;

        if (addon.pricing_model === 'per_person') {
          quantityForDb = baseQty * totalPax;
        }

        const lineTotal = quantityForDb * unitPrice;
        addonsAmount += lineTotal;

        addonIdsDb.push(id);
        addonQuantitiesDb.push(quantityForDb);
        addonPricesDb.push(unitPrice);
      });
    }

    const totalAmount = baseAmount + addonsAmount;

    // Delegate creation to the database function so that reference numbers,
    // guest upsert, capacity checks, and audit logging are handled in one place.
    const { data: result, error } = await supabase.rpc('create_day_tour_booking', {
      p_tenant_id: tenantId,
      p_tour_date: data.tour_date,
      p_num_adults: data.num_adults,
      p_num_children: data.num_children,
      p_guest_first_name: data.guest_first_name,
      p_guest_last_name: data.guest_last_name,
      p_guest_email: data.guest_email,
      p_guest_phone: data.guest_phone,
      p_special_requests: data.special_requests || null,
      p_base_amount: baseAmount,
      p_addons_amount: addonsAmount,
      p_total_amount: totalAmount,
      p_source: 'online',
      p_created_by: null,
      p_addon_ids: addonIdsDb,
      p_addon_quantities: addonQuantitiesDb,
      p_addon_prices: addonPricesDb,
    });

    if (error) {
      console.error('[day-tour-bookings] RPC error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create day tour booking' },
        { status: 400 }
      );
    }

    if (!result || (result as DayTourRpcResult).success !== true) {
      const rpcError = (result as DayTourRpcResult)?.error || 'Failed to create day tour booking';
      return NextResponse.json(
        { success: false, error: rpcError },
        { status: 400 }
      );
    }

    const typedResult = result as DayTourRpcResult;
    return NextResponse.json({
      success: true,
      data: {
        booking_id: typedResult.booking_id,
        reference_number: typedResult.reference_number,
      },
    });
  } catch (error) {
    console.error('[day-tour-bookings] POST error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
