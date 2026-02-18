import { NextRequest, NextResponse } from 'next/server';
import { getTenantId } from '@/lib/tenant';
import { createAdminClient } from '@/lib/supabase/admin';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/get-ip';
import { validateEnum } from '@/lib/sanitize';

export async function GET(request: NextRequest) {
  try {
    // Rate limit: 120 requests per minute per IP
    const ip = getClientIp(request);
    const rl = rateLimit(ip, 'public/addons', { windowMs: 60_000, max: 120 });
    if (!rl.success) return rateLimitResponse(rl.resetMs);

    const tenantId = await getTenantId();
    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const appliesTo = validateEnum(
      searchParams.get('applies_to'),
      ['overnight', 'day_tour', 'both'] as const,
      'overnight'
    );

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('addons')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .or(`applies_to.eq.${appliesTo},applies_to.eq.both`)
      .order('sort_order', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[public/addons] error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
