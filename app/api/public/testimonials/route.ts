import { NextResponse } from 'next/server';
import { getTenantId } from '@/lib/tenant';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const tenantId = await getTenantId();
    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('testimonials')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_featured', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
