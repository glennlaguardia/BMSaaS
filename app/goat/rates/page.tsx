'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Loader2, Plus, Pencil, CalendarRange, Percent, ArrowDown, ArrowUp, DollarSign, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';
import { formatPHP } from '@/lib/pricing';
import { formatDate, capitalize } from '@/lib/utils';
import type { RateAdjustment, AdjustmentType } from '@/types';

interface RateFormData {
  name: string;
  start_date: string;
  end_date: string;
  adjustment_type: AdjustmentType;
  adjustment_value: number;
  applies_to: 'all' | 'specific';
  accommodation_type_ids: string[];
  is_active: boolean;
}

const emptyForm: RateFormData = {
  name: '',
  start_date: '',
  end_date: '',
  adjustment_type: 'percentage_discount',
  adjustment_value: 0,
  applies_to: 'all',
  accommodation_type_ids: [],
  is_active: true,
};

export default function RatesPage() {
  const [rates, setRates] = useState<RateAdjustment[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<RateFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchRates = useCallback(() => {
    setLoading(true);
    fetch('/api/admin/rates')
      .then(r => r.json())
      .then(data => { if (data.success) setRates(data.data); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchRates(); }, [fetchRates]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError('');
    setDialogOpen(true);
  };

  const openEdit = (rate: RateAdjustment) => {
    setEditingId(rate.id);
    setForm({
      name: rate.name,
      start_date: rate.start_date,
      end_date: rate.end_date,
      adjustment_type: rate.adjustment_type,
      adjustment_value: rate.adjustment_value,
      applies_to: rate.applies_to,
      accommodation_type_ids: Array.isArray(rate.accommodation_type_ids) ? rate.accommodation_type_ids : [],
      is_active: rate.is_active,
    });
    setError('');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Name is required'); return; }
    if (!form.start_date) { setError('Start date is required'); return; }
    if (!form.end_date) { setError('End date is required'); return; }
    if (form.start_date > form.end_date) { setError('Start date must be before end date'); return; }
    if (form.adjustment_value < 0) { setError('Adjustment value must be positive'); return; }

    setSaving(true);
    setError('');

    try {
      const url = editingId
        ? `/api/admin/rates/${editingId}`
        : '/api/admin/rates';
      const method = editingId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (data.success) {
        setDialogOpen(false);
        fetchRates();
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
    await fetch(`/api/admin/rates/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !currentlyActive }),
    });
    fetchRates();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this rate adjustment?')) return;
    await fetch(`/api/admin/rates/${id}`, { method: 'DELETE' });
    fetchRates();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'percentage_discount': return <ArrowDown className="w-4 h-4 text-forest-500" />;
      case 'percentage_surcharge': return <ArrowUp className="w-4 h-4 text-rose-600" />;
      case 'fixed_override': return <DollarSign className="w-4 h-4 text-blue-600" />;
      default: return <Percent className="w-4 h-4" />;
    }
  };

  const getLabel = (adj: RateAdjustment) => {
    switch (adj.adjustment_type) {
      case 'percentage_discount': return `${adj.adjustment_value}% discount`;
      case 'percentage_surcharge': return `${adj.adjustment_value}% surcharge`;
      case 'fixed_override': return `Override to ${formatPHP(adj.adjustment_value)}`;
      default: return '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-forest-700">Rate Adjustments</h1>
          <p className="text-sm text-forest-500/45 mt-1 font-medium">Manage seasonal pricing, discounts, and surcharges</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Add Adjustment
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-forest-500/30" />
        </div>
      ) : rates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-forest-500/40">
            No rate adjustments configured. Default weekday/weekend rates apply.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {rates.map((rate) => (
            <Card key={rate.id}>
              <CardContent className="pt-5 pb-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-cream-100 mt-0.5">
                      {getIcon(rate.adjustment_type)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-forest-700">{rate.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <CalendarRange className="w-3.5 h-3.5 text-forest-500/35" />
                        <span className="text-sm text-forest-500/50">
                          {formatDate(rate.start_date)} — {formatDate(rate.end_date)}
                        </span>
                      </div>
                      <div className="flex gap-2 mt-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          {getLabel(rate)}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          Applies to: {capitalize(rate.applies_to)}
                        </Badge>
                        <Badge variant={rate.is_active ? 'default' : 'secondary'} className="text-xs">
                          {rate.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleActive(rate.id, rate.is_active)}
                      title={rate.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {rate.is_active ? <ToggleRight className="w-4 h-4 text-forest-500" /> : <ToggleLeft className="w-4 h-4 text-forest-500/30" />}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(rate)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(rate.id)} className="text-red-500 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Rate Adjustment' : 'Add Rate Adjustment'}</DialogTitle>
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
                placeholder="e.g. Holy Week Surcharge, Summer Promo"
                className="mt-1"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Start Date <span className="text-red-400">*</span></Label>
                <Input
                  type="date"
                  value={form.start_date}
                  onChange={(e) => setForm(f => ({ ...f, start_date: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>End Date <span className="text-red-400">*</span></Label>
                <Input
                  type="date"
                  value={form.end_date}
                  onChange={(e) => setForm(f => ({ ...f, end_date: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Adjustment Type</Label>
                <Select
                  value={form.adjustment_type}
                  onValueChange={(v) => setForm(f => ({ ...f, adjustment_type: v as AdjustmentType }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage_discount">% Discount</SelectItem>
                    <SelectItem value="percentage_surcharge">% Surcharge</SelectItem>
                    <SelectItem value="fixed_override">Fixed Override</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>
                  {form.adjustment_type === 'fixed_override' ? 'Override Rate (PHP)' : 'Percentage (%)'}
                  <span className="text-red-400"> *</span>
                </Label>
                <Input
                  type="number"
                  min={0}
                  step={form.adjustment_type === 'fixed_override' ? 1 : 0.1}
                  value={form.adjustment_value}
                  onChange={(e) => setForm(f => ({ ...f, adjustment_value: Number(e.target.value) }))}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label>Applies To</Label>
              <Select
                value={form.applies_to}
                onValueChange={(v) => setForm(f => ({ ...f, applies_to: v as 'all' | 'specific' }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Accommodations</SelectItem>
                  <SelectItem value="specific">Specific Types</SelectItem>
                </SelectContent>
              </Select>
              {form.applies_to === 'specific' && (
                <p className="text-xs text-forest-500/35 mt-1">
                  Specific type selection coming soon. This will apply to all for now.
                </p>
              )}
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
