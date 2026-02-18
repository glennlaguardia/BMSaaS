'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Plus, Pencil, ToggleLeft, ToggleRight } from 'lucide-react';
import { formatPHP } from '@/lib/pricing';
import { capitalize } from '@/lib/utils';
import type { Addon, PricingModel, AddonCategory, AddonAppliesTo } from '@/types';

interface AddonFormData {
  name: string;
  description: string;
  price: number;
  pricing_model: PricingModel;
  category: AddonCategory;
  applies_to: AddonAppliesTo;
  is_active: boolean;
  sort_order: number;
}

const emptyForm: AddonFormData = {
  name: '',
  description: '',
  price: 0,
  pricing_model: 'per_booking',
  category: 'experience',
  applies_to: 'both',
  is_active: true,
  sort_order: 0,
};

export default function AddonsPage() {
  const [addons, setAddons] = useState<Addon[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AddonFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchAddons = useCallback(() => {
    setLoading(true);
    fetch('/api/admin/addons')
      .then(r => r.json())
      .then(data => { if (data.success) setAddons(data.data); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchAddons(); }, [fetchAddons]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError('');
    setDialogOpen(true);
  };

  const openEdit = (addon: Addon) => {
    setEditingId(addon.id);
    setForm({
      name: addon.name,
      description: addon.description || '',
      price: addon.price,
      pricing_model: addon.pricing_model,
      category: addon.category,
      applies_to: addon.applies_to,
      is_active: addon.is_active,
      sort_order: addon.sort_order,
    });
    setError('');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Name is required'); return; }
    if (form.price < 0) { setError('Price must be positive'); return; }

    setSaving(true);
    setError('');

    const payload = {
      ...form,
      description: form.description || null,
    };

    try {
      const url = editingId
        ? `/api/admin/addons/${editingId}`
        : '/api/admin/addons';
      const method = editingId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setDialogOpen(false);
        fetchAddons();
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
    await fetch(`/api/admin/addons/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !currentlyActive }),
    });
    fetchAddons();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-forest-700">Add-ons</h1>
          <p className="text-sm text-forest-500/45 mt-1 font-medium">Manage experiences, meals, and extras</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Add Add-on
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-forest-500/30" />
        </div>
      ) : (
        <div className="grid gap-3">
          {addons.map((addon) => (
            <Card key={addon.id}>
              <CardContent className="pt-5 pb-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-forest-700">{addon.name}</h3>
                      <Badge variant={addon.is_active ? 'default' : 'secondary'} className="text-xs">
                        {addon.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    {addon.description && (
                      <p className="text-sm text-forest-500/45 mt-1">{addon.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      <Badge variant="outline" className="text-xs">{capitalize(addon.category)}</Badge>
                      <Badge variant="outline" className="text-xs">{capitalize(addon.applies_to.replace('_', ' '))}</Badge>
                      <span className="text-xs text-forest-500/35">
                        {addon.pricing_model === 'per_person' ? 'Per person' : 'Per booking'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-forest-700">{formatPHP(addon.price)}</p>
                    <div className="flex gap-1 mt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleActive(addon.id, addon.is_active)}
                      >
                        {addon.is_active ? <ToggleRight className="w-4 h-4 text-forest-500" /> : <ToggleLeft className="w-4 h-4 text-forest-500/30" />}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openEdit(addon)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {addons.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center text-forest-500/40">
                No add-ons configured yet.
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Add-on' : 'Add Add-on'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{error}</div>
            )}

            <div>
              <Label>Name <span className="text-red-400">*</span></Label>
              <Input
                value={form.name}
                onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Strawberry Farm Tour"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Brief description of the add-on..."
                className="mt-1 min-h-[80px]"
                maxLength={1000}
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Price (PHP) <span className="text-red-400">*</span></Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={form.price}
                  onChange={(e) => setForm(f => ({ ...f, price: Number(e.target.value) }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Pricing Model</Label>
                <Select
                  value={form.pricing_model}
                  onValueChange={(v) => setForm(f => ({ ...f, pricing_model: v as PricingModel }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="per_booking">Per Booking</SelectItem>
                    <SelectItem value="per_person">Per Person</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm(f => ({ ...f, category: v as AddonCategory }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="experience">Experience</SelectItem>
                    <SelectItem value="meal">Meal</SelectItem>
                    <SelectItem value="amenity">Amenity</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Applies To</Label>
                <Select
                  value={form.applies_to}
                  onValueChange={(v) => setForm(f => ({ ...f, applies_to: v as AddonAppliesTo }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="overnight">Overnight Only</SelectItem>
                    <SelectItem value="day_tour">Day Tour Only</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

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
