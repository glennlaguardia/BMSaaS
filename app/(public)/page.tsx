import { getTenant } from '@/lib/tenant';
import { createAdminClient } from '@/lib/supabase/admin';
import { LandingPage } from '@/components/public/LandingPage';
import type { Tenant, WebsiteSection, AccommodationType, Testimonial } from '@/types';

export const dynamic = 'force-dynamic';

async function getPageData(tenantId: string) {
  const supabase = createAdminClient();

  const [sectionsRes, typesRes, testimonialsRes] = await Promise.all([
    supabase
      .from('website_sections')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_visible', true)
      .order('sort_order', { ascending: true }),
    supabase
      .from('accommodation_types')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
    supabase
      .from('testimonials')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_featured', true)
      .order('created_at', { ascending: false }),
  ]);

  return {
    sections: (sectionsRes.data || []) as WebsiteSection[],
    types: (typesRes.data || []) as AccommodationType[],
    testimonials: (testimonialsRes.data || []) as Testimonial[],
  };
}

export default async function HomePage() {
  const tenant = await getTenant();

  if (!tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F0E8]">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#2D5016]">BudaBook</h1>
          <p className="text-stone-500 mt-2">Resort not found or not yet configured.</p>
          <p className="text-sm text-stone-400 mt-1">
            Check back soon or contact the resort directly.
          </p>
        </div>
      </div>
    );
  }

  const { sections, types, testimonials } = await getPageData(tenant.id);

  return (
    <LandingPage
      tenant={tenant as Tenant}
      sections={sections}
      types={types}
      testimonials={testimonials}
    />
  );
}
