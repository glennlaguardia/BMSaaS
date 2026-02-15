import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { roomSchema } from '@/lib/validations';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const parsed = roomSchema.partial().safeParse(body);
    if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid data' }, { status: 400 });

    const supabase = createAdminClient();

    // Ensure room belongs to tenant via accommodation_types
    const { data: room } = await supabase
      .from('rooms')
      .select('id, accommodation_types!inner(tenant_id)')
      .eq('id', id)
      .eq('accommodation_types.tenant_id', session.tenant_id)
      .single();

    if (!room) return NextResponse.json({ success: false, error: 'Room not found' }, { status: 404 });

    const { data, error } = await supabase
      .from('rooms')
      .update(parsed.data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const supabase = createAdminClient();

    const { data: room } = await supabase
      .from('rooms')
      .select('id, accommodation_types!inner(tenant_id)')
      .eq('id', id)
      .eq('accommodation_types.tenant_id', session.tenant_id)
      .single();

    if (!room) return NextResponse.json({ success: false, error: 'Room not found' }, { status: 404 });

    const { error } = await supabase
      .from('rooms')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
