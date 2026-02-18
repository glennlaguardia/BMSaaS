import { NextRequest, NextResponse } from 'next/server';
import { getTenantId } from '@/lib/tenant';
import { createAdminClient } from '@/lib/supabase/admin';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/get-ip';

export async function GET(request: NextRequest) {
  try {
    // Rate limit: 120 requests per minute per IP
    const ip = getClientIp(request);
    const rl = rateLimit(ip, 'public/sections', { windowMs: 60_000, max: 120 });
    if (!rl.success) return rateLimitResponse(rl.resetMs);

    const tenantId = await getTenantId();
    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('website_sections')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_visible', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[public/sections] error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
