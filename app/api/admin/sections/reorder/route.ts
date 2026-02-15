import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { orderedIds } = await request.json();
    if (!Array.isArray(orderedIds)) {
      return NextResponse.json({ success: false, error: 'orderedIds must be an array' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const updates = orderedIds.map((id: string, index: number) =>
      supabase
        .from('website_sections')
        .update({ sort_order: index })
        .eq('id', id)
        .eq('tenant_id', session.tenant_id)
    );

    await Promise.all(updates);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
