'use client';

import { useState, useEffect } from 'react';
import { BookingWizard } from '@/components/booking/BookingWizard';
import type { Tenant, AccommodationType, Addon } from '@/types';

export default function BookingPage() {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [types, setTypes] = useState<AccommodationType[]>([]);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/public/tenant').then(r => r.json()),
      fetch('/api/public/accommodation-types').then(r => r.json()),
      fetch('/api/public/addons?applies_to=overnight').then(r => r.json()),
    ])
      .then(([tenantRes, typesRes, addonsRes]) => {
        if (tenantRes.success) setTenant(tenantRes.data);
        if (typesRes.success) setTypes(typesRes.data);
        if (addonsRes.success) setAddons(addonsRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F0E8]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#2D5016] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-stone-500 mt-3">Loading booking...</p>
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F0E8]">
        <p className="text-stone-500">Resort not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F0E8]">
      <BookingWizard
        tenant={tenant}
        accommodationTypes={types}
        addons={addons}
      />
    </div>
  );
}
