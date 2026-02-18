import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';

const reorderSchema = z.object({
  orderedIds: z.array(z.string().uuid()).min(1).max(50),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const parsed = reorderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid input', details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const supabase = createAdminClient();
    const updates = parsed.data.orderedIds.map((id, index) =>
      supabase
        .from('website_sections')
        .update({ sort_order: index })
        .eq('id', id)
        .eq('tenant_id', session.tenant_id)
    );

    const results = await Promise.all(updates);
    for (const result of results) {
      if (result.error) throw result.error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[admin/sections/reorder] error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
