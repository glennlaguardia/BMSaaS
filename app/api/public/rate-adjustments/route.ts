import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getTenantId } from '@/lib/tenant';

export async function GET() {
  try {
    const tenantId = await getTenantId();
    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });
    }

    const supabase = createAdminClient();
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('rate_adjustments')
      .select('id, name, start_date, end_date, adjustment_type, adjustment_value, applies_to, accommodation_type_ids')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .gte('end_date', today)
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
