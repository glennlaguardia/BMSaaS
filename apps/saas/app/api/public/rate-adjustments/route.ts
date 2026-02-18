import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getTenantId } from '@/lib/tenant';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/get-ip';
import { publicDateRangeSchema } from '@/lib/validations';

export async function GET(request: NextRequest) {
  try {
    // Rate limit: 120 requests per minute per IP
    const ip = getClientIp(request);
    const rl = rateLimit(ip, 'public/rate-adjustments', { windowMs: 60_000, max: 120 });
    if (!rl.success) return rateLimitResponse(rl.resetMs);

    const tenantId = await getTenantId();
    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });
    }

    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);
    const rateParams = publicDateRangeSchema.safeParse({
      check_in: searchParams.get('check_in') ?? undefined,
      check_out: searchParams.get('check_out') ?? undefined,
    });
    if (!rateParams.success) {
      return NextResponse.json({ success: false, error: 'Invalid query parameters' }, { status: 400 });
    }
    const dateFrom = rateParams.data.check_in || new Date().toISOString().split('T')[0];
    const dateTo = rateParams.data.check_out || dateFrom;

    const { data, error } = await supabase
      .from('rate_adjustments')
      .select('id, name, start_date, end_date, adjustment_type, adjustment_value, applies_to, accommodation_type_ids')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .lte('start_date', dateTo)
      .gte('end_date', dateFrom)
      .order('start_date', { ascending: true });

    if (error) {
      return NextResponse.json({ success: false, error: 'Failed to fetch rate adjustments' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[public/rate-adjustments] error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
