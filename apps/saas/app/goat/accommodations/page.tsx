'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Loader2, Plus, Pencil, Users, ToggleLeft, ToggleRight, X } from 'lucide-react';
import { formatPHP } from '@/lib/pricing';
import type { AccommodationType } from '@/types';

interface FormData {
  name: string;
  slug: string;
  short_description: string;
  description: string;
  base_rate_weekday: number;
  base_rate_weekend: number;
  base_pax: number;
  max_pax: number;
  additional_pax_fee: number;
  size_sqm: number | null;
  amenities: string[];
  inclusions: string[];
  is_active: boolean;
  sort_order: number;
}

const emptyForm: FormData = {
  name: '',
  slug: '',
  short_description: '',
  description: '',
  base_rate_weekday: 0,
  base_rate_weekend: 0,
  base_pax: 2,
  max_pax: 4,
  additional_pax_fee: 0,
  size_sqm: null,
  amenities: [],
  inclusions: [],
  is_active: true,
  sort_order: 0,
};

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function AccommodationsPage() {
  const [types, setTypes] = useState<AccommodationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [amenityInput, setAmenityInput] = useState('');
  const [inclusionInput, setInclusionInput] = useState('');

  const fetchTypes = useCallback(() => {
    setLoading(true);
    fetch('/api/admin/accommodation-types')
      .then(r => r.json())
      .then(data => { if (data.success) setTypes(data.data); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchTypes(); }, [fetchTypes]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError('');
    setAmenityInput('');
    setInclusionInput('');
    setDialogOpen(true);
  };

  const openEdit = (type: AccommodationType) => {
    setEditingId(type.id);
    setForm({
      name: type.name,
      slug: type.slug,
      short_description: type.short_description || '',
      description: type.description || '',
      base_rate_weekday: type.base_rate_weekday,
      base_rate_weekend: type.base_rate_weekend,
      base_pax: type.base_pax,
      max_pax: type.max_pax,
      additional_pax_fee: type.additional_pax_fee,
      size_sqm: type.size_sqm,
      amenities: Array.isArray(type.amenities) ? type.amenities : [],
      inclusions: Array.isArray(type.inclusions) ? type.inclusions : [],
      is_active: type.is_active,
      sort_order: type.sort_order,
    });
    setError('');
    setAmenityInput('');
    setInclusionInput('');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Name is required'); return; }
    if (form.base_rate_weekday < 0) { setError('Weekday rate must be positive'); return; }
    if (form.base_rate_weekend < 0) { setError('Weekend rate must be positive'); return; }
    if (form.base_pax < 1) { setError('Base pax must be at least 1'); return; }
    if (form.max_pax < form.base_pax) { setError('Max pax must be >= base pax'); return; }

    setSaving(true);
    setError('');

    const slug = form.slug.trim() || slugify(form.name);
    const payload = {
      ...form,
      slug,
      short_description: form.short_description || null,
      description: form.description || null,
      size_sqm: form.size_sqm || null,
    };

    try {
      const url = editingId
        ? `/api/admin/accommodation-types/${editingId}`
        : '/api/admin/accommodation-types';
      const method = editingId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setDialogOpen(false);
        fetchTypes();
      } else {
        setError(data.error || 'Failed to save');
      }
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (id: string, currentlyActive: boolean) => {
    await fetch(`/api/admin/accommodation-types/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !currentlyActive }),
    });
    fetchTypes();
  };

  const addAmenity = () => {
    const val = amenityInput.trim();
    if (val && !form.amenities.includes(val)) {
      setForm(f => ({ ...f, amenities: [...f.amenities, val] }));
      setAmenityInput('');
    }
  };

  const removeAmenity = (item: string) => {
    setForm(f => ({ ...f, amenities: f.amenities.filter(a => a !== item) }));
  };

  const addInclusion = () => {
    const val = inclusionInput.trim();
    if (val && !form.inclusions.includes(val)) {
      setForm(f => ({ ...f, inclusions: [...f.inclusions, val] }));
      setInclusionInput('');
    }
  };

  const removeInclusion = (item: string) => {
    setForm(f => ({ ...f, inclusions: f.inclusions.filter(a => a !== item) }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-forest-700">Accommodations</h1>
          <p className="text-sm text-forest-500/45 mt-1 font-medium">Manage room types and their configurations</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Add Type
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-forest-500/30" />
        </div>
      ) : types.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-forest-500/40">
            No accommodation types configured yet.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {types.map((type) => {
            const amenities = Array.isArray(type.amenities) ? type.amenities : [];
            return (
              <Card key={type.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {type.name}
                        <Badge variant={type.is_active ? 'default' : 'secondary'}>
                          {type.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </CardTitle>
                      <p className="text-sm text-forest-500/45 mt-1">{type.short_description}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleActive(type.id, type.is_active)}
                        title={type.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {type.is_active ? <ToggleRight className="w-4 h-4 text-forest-500" /> : <ToggleLeft className="w-4 h-4 text-forest-500/30" />}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openEdit(type)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-forest-500/45">Weekday Rate</p>
                      <p className="font-semibold">{formatPHP(type.base_rate_weekday)}</p>
                    </div>
                    <div>
                      <p className="text-forest-500/45">Weekend Rate</p>
                      <p className="font-semibold">{formatPHP(type.base_rate_weekend)}</p>
                    </div>
                    <div>
                      <p className="text-forest-500/45">Capacity</p>
                      <p className="font-semibold flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {type.base_pax}–{type.max_pax} guests
                      </p>
                    </div>
                    <div>
                      <p className="text-forest-500/45">Extra Pax Fee</p>
                      <p className="font-semibold">{formatPHP(type.additional_pax_fee)}/person</p>
                    </div>
                  </div>
                  {amenities.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {amenities.map((a) => (
                        <span key={a} className="px-2 py-0.5 bg-cream-100 text-forest-500/60 text-xs rounded-full">{a}</span>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Accommodation Type' : 'Add Accommodation Type'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{error}</div>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Name <span className="text-red-400">*</span></Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm(f => ({ ...f, name: e.target.value, slug: f.slug || slugify(e.target.value) }))}
                  placeholder="e.g. Deluxe Cabin"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Slug</Label>
                <Input
                  value={form.slug}
                  onChange={(e) => setForm(f => ({ ...f, slug: e.target.value }))}
                  placeholder="deluxe-cabin"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label>Short Description</Label>
              <Input
                value={form.short_description}
                onChange={(e) => setForm(f => ({ ...f, short_description: e.target.value }))}
                placeholder="Brief tagline for listings"
                className="mt-1"
                maxLength={500}
              />
            </div>

            <div>
              <Label>Full Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Detailed description..."
                className="mt-1 min-h-[80px]"
                maxLength={2000}
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Weekday Rate (PHP) <span className="text-red-400">*</span></Label>
                <Input
                  type="number"
                  min={0}
                  value={form.base_rate_weekday}
                  onChange={(e) => setForm(f => ({ ...f, base_rate_weekday: Number(e.target.value) }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Weekend Rate (PHP) <span className="text-red-400">*</span></Label>
                <Input
                  type="number"
                  min={0}
                  value={form.base_rate_weekend}
                  onChange={(e) => setForm(f => ({ ...f, base_rate_weekend: Number(e.target.value) }))}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <Label>Base Pax <span className="text-red-400">*</span></Label>
                <Input
                  type="number"
                  min={1}
                  value={form.base_pax}
                  onChange={(e) => setForm(f => ({ ...f, base_pax: Number(e.target.value) }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Max Pax <span className="text-red-400">*</span></Label>
                <Input
                  type="number"
                  min={1}
                  value={form.max_pax}
                  onChange={(e) => setForm(f => ({ ...f, max_pax: Number(e.target.value) }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Extra Pax Fee (PHP)</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.additional_pax_fee}
                  onChange={(e) => setForm(f => ({ ...f, additional_pax_fee: Number(e.target.value) }))}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label>Size (sqm)</Label>
              <Input
                type="number"
                min={0}
                value={form.size_sqm ?? ''}
                onChange={(e) => setForm(f => ({ ...f, size_sqm: e.target.value ? Number(e.target.value) : null }))}
                placeholder="Optional"
                className="mt-1"
              />
            </div>

            {/* Amenities */}
            <div>
              <Label>Amenities</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={amenityInput}
                  onChange={(e) => setAmenityInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addAmenity(); } }}
                  placeholder="e.g. WiFi, Pool Access"
                />
                <Button type="button" variant="outline" size="sm" onClick={addAmenity}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {form.amenities.map(a => (
                  <span key={a} className="inline-flex items-center gap-1 px-2 py-0.5 bg-cream-100 text-forest-500/70 text-xs rounded-full">
                    {a}
                    <button onClick={() => removeAmenity(a)} className="hover:text-red-500">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Inclusions */}
            <div>
              <Label>Inclusions</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={inclusionInput}
                  onChange={(e) => setInclusionInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addInclusion(); } }}
                  placeholder="e.g. Breakfast, Towels"
                />
                <Button type="button" variant="outline" size="sm" onClick={addInclusion}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {form.inclusions.map(a => (
                  <span key={a} className="inline-flex items-center gap-1 px-2 py-0.5 bg-forest-50 text-forest-600 text-xs rounded-full">
                    {a}
                    <button onClick={() => removeInclusion(a)} className="hover:text-red-500">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Sort Order</Label>
                <Input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setForm(f => ({ ...f, sort_order: Number(e.target.value) }))}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {editingId ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
