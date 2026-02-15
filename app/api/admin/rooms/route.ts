import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { roomSchema } from '@/lib/validations';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const typeId = request.nextUrl.searchParams.get('accommodation_type_id');
    const supabase = createAdminClient();

    let query = supabase
      .from('rooms')
      .select('*, accommodation_types!inner(tenant_id, name)')
      .eq('accommodation_types.tenant_id', session.tenant_id)
      .order('sort_order', { ascending: true });

    if (typeId) {
      query = query.eq('accommodation_type_id', typeId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[admin/rooms] error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const parsed = roomSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid data' }, { status: 400 });

    // Verify the accommodation type belongs to this tenant
    const supabase = createAdminClient();
    const { data: typeData } = await supabase
      .from('accommodation_types')
      .select('id')
      .eq('id', parsed.data.accommodation_type_id)
      .eq('tenant_id', session.tenant_id)
      .single();

    if (!typeData) return NextResponse.json({ success: false, error: 'Accommodation type not found' }, { status: 404 });

    const { data, error } = await supabase
      .from('rooms')
      .insert(parsed.data)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[admin/rooms] error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
