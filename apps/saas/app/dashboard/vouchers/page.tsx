'use client';

import { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Search, ChevronLeft, ChevronRight, Loader2, Plus, Ticket, Pencil, ToggleLeft, ToggleRight } from 'lucide-react';
import { formatPHP } from '@/lib/pricing';

interface Voucher {
    id: string;
    code: string;
    description: string | null;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    min_booking_amount: number;
    max_discount: number | null;
    usage_limit: number | null;
    times_used: number;
    valid_from: string | null;
    valid_until: string | null;
    applies_to: 'overnight' | 'day_tour' | 'both';
    is_active: boolean;
    created_at: string;
}

interface VoucherForm {
    code: string;
    description: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    min_booking_amount: number;
    max_discount: number | null;
    usage_limit: number | null;
    valid_from: string;
    valid_until: string;
    applies_to: 'overnight' | 'day_tour' | 'both';
    is_active: boolean;
}

const emptyForm: VoucherForm = {
    code: '',
    description: '',
    discount_type: 'percentage',
    discount_value: 0,
    min_booking_amount: 0,
    max_discount: null,
    usage_limit: null,
    valid_from: '',
    valid_until: '',
    applies_to: 'both',
    is_active: true,
};

export default function VouchersPage() {
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('all');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 20;

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');

    const fetchVouchers = useCallback(async () => {
        setLoading(true);
        const params = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (search) params.set('search', search);
        if (status !== 'all') params.set('status', status);

        try {
            const res = await fetch(`/api/admin/vouchers?${params}`);
            const data = await res.json();
            if (data.success) {
                setVouchers(data.data);
                setTotal(data.pagination.total);
            }
        } finally {
            setLoading(false);
        }
    }, [page, search, status]);

    useEffect(() => { fetchVouchers(); }, [fetchVouchers]);

    const totalPages = Math.ceil(total / limit);

    const openCreate = () => {
        setEditingId(null);
        setForm(emptyForm);
        setFormError('');
        setDialogOpen(true);
    };

    const openEdit = (v: Voucher) => {
        setEditingId(v.id);
        setForm({
            code: v.code,
            description: v.description || '',
            discount_type: v.discount_type,
            discount_value: v.discount_value,
            min_booking_amount: v.min_booking_amount,
            max_discount: v.max_discount,
            usage_limit: v.usage_limit,
            valid_from: v.valid_from || '',
            valid_until: v.valid_until || '',
            applies_to: v.applies_to as 'overnight' | 'day_tour' | 'both',
            is_active: v.is_active,
        });
        setFormError('');
        setDialogOpen(true);
    };

    const handleSave = async () => {
        setSaving(true);
        setFormError('');
        try {
            const payload = {
                ...form,
                description: form.description || null,
                valid_from: form.valid_from || null,
                valid_until: form.valid_until || null,
                discount_value: Number(form.discount_value),
                min_booking_amount: Number(form.min_booking_amount),
                max_discount: form.max_discount ? Number(form.max_discount) : null,
                usage_limit: form.usage_limit ? Number(form.usage_limit) : null,
            };

            const url = editingId ? `/api/admin/vouchers/${editingId}` : '/api/admin/vouchers';
            const method = editingId ? 'PATCH' : 'POST';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (data.success) {
                setDialogOpen(false);
                fetchVouchers();
            } else {
                setFormError(data.error || 'Failed to save voucher');
            }
        } catch {
            setFormError('Network error');
        } finally {
            setSaving(false);
        }
    };

    const toggleActive = async (id: string, currentlyActive: boolean) => {
        await fetch(`/api/admin/vouchers/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_active: !currentlyActive }),
        });
        fetchVouchers();
    };

    const discountLabel = (v: Voucher) => {
        if (v.discount_type === 'percentage') {
            return `${v.discount_value}%${v.max_discount ? ` (max ${formatPHP(v.max_discount)})` : ''}`;
        }
        return formatPHP(v.discount_value);
    };

    const statusBadge = (v: Voucher) => {
        if (!v.is_active) return <Badge variant="outline">Inactive</Badge>;
        if (v.valid_until && v.valid_until < new Date().toISOString().split('T')[0]) {
            return <Badge variant="destructive">Expired</Badge>;
        }
        return <Badge variant="default">Active</Badge>;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-forest-700 flex items-center gap-2">
                        <Ticket className="w-6 h-6 text-amber-500" />
                        Vouchers
                    </h1>
                    <p className="text-sm text-forest-500/45 mt-1">{total} total vouchers</p>
                </div>
                <Button onClick={openCreate}>
                    <Plus className="w-4 h-4 mr-2" />
                    New Voucher
                </Button>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-forest-500/35" />
                            <Input
                                placeholder="Search by code or description..."
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                className="pl-9"
                            />
                        </div>
                        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                                <SelectItem value="expired">Expired</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Voucher List</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-6 h-6 animate-spin text-forest-500/35" />
                        </div>
                    ) : vouchers.length === 0 ? (
                        <p className="text-center text-forest-500/45 py-12">No vouchers found.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-3 px-2 font-medium text-forest-500/45">Code</th>
                                        <th className="text-left py-3 px-2 font-medium text-forest-500/45 hidden md:table-cell">Description</th>
                                        <th className="text-left py-3 px-2 font-medium text-forest-500/45">Discount</th>
                                        <th className="text-left py-3 px-2 font-medium text-forest-500/45 hidden lg:table-cell">Usage</th>
                                        <th className="text-left py-3 px-2 font-medium text-forest-500/45 hidden lg:table-cell">Applies To</th>
                                        <th className="text-left py-3 px-2 font-medium text-forest-500/45">Status</th>
                                        <th className="text-right py-3 px-2 font-medium text-forest-500/45"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {vouchers.map((v) => (
                                        <tr key={v.id} className="border-b last:border-0 hover:bg-forest-50">
                                            <td className="py-3 px-2">
                                                <span className="font-mono text-xs font-semibold text-forest-700">{v.code}</span>
                                            </td>
                                            <td className="py-3 px-2 hidden md:table-cell text-forest-500/60 max-w-[200px] truncate">
                                                {v.description || '—'}
                                            </td>
                                            <td className="py-3 px-2 text-forest-700 font-medium">
                                                {discountLabel(v)}
                                            </td>
                                            <td className="py-3 px-2 hidden lg:table-cell text-forest-500/60 text-xs">
                                                {v.times_used}{v.usage_limit ? ` / ${v.usage_limit}` : ' / ∞'}
                                            </td>
                                            <td className="py-3 px-2 hidden lg:table-cell text-forest-500/60 text-xs capitalize">
                                                {v.applies_to === 'both' ? 'All' : v.applies_to.replace('_', ' ')}
                                            </td>
                                            <td className="py-3 px-2">
                                                {statusBadge(v)}
                                            </td>
                                            <td className="py-3 px-2 text-right">
                                                <div className="flex gap-1 justify-end">
                                                    <Button variant="ghost" size="sm" onClick={() => openEdit(v)}>
                                                        <Pencil className="w-3.5 h-3.5" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => toggleActive(v.id, v.is_active)}
                                                        title={v.is_active ? 'Deactivate' : 'Activate'}
                                                    >
                                                        {v.is_active ? <ToggleRight className="w-4 h-4 text-forest-500" /> : <ToggleLeft className="w-4 h-4 text-forest-500/30" />}
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4 pt-4 border-t">
                            <p className="text-sm text-forest-500/45">Page {page} of {totalPages}</p>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page <= 1}>
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}>
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Create/Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{editingId ? 'Edit Voucher' : 'Create Voucher'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        {formError && (
                            <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{formError}</p>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className="text-xs">Code</Label>
                                <Input
                                    value={form.code}
                                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                                    placeholder="SUMMER2025"
                                    className="font-mono"
                                />
                            </div>
                            <div>
                                <Label className="text-xs">Applies To</Label>
                                <Select value={form.applies_to} onValueChange={(v) => setForm({ ...form, applies_to: v as typeof form.applies_to })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="both">All Bookings</SelectItem>
                                        <SelectItem value="overnight">Overnight Only</SelectItem>
                                        <SelectItem value="day_tour">Day Tours Only</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div>
                            <Label className="text-xs">Description (optional)</Label>
                            <Input
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                                placeholder="Summer special discount"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className="text-xs">Discount Type</Label>
                                <Select value={form.discount_type} onValueChange={(v) => setForm({ ...form, discount_type: v as typeof form.discount_type })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                                        <SelectItem value="fixed">Fixed Amount (₱)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label className="text-xs">
                                    {form.discount_type === 'percentage' ? 'Discount (%)' : 'Discount (₱)'}
                                </Label>
                                <Input
                                    type="number"
                                    value={form.discount_value || ''}
                                    onChange={(e) => setForm({ ...form, discount_value: Number(e.target.value) })}
                                    min={0}
                                    max={form.discount_type === 'percentage' ? 100 : 999999}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className="text-xs">Min Booking Amount (₱)</Label>
                                <Input
                                    type="number"
                                    value={form.min_booking_amount || ''}
                                    onChange={(e) => setForm({ ...form, min_booking_amount: Number(e.target.value) })}
                                    min={0}
                                />
                            </div>
                            {form.discount_type === 'percentage' && (
                                <div>
                                    <Label className="text-xs">Max Discount Cap (₱)</Label>
                                    <Input
                                        type="number"
                                        value={form.max_discount || ''}
                                        onChange={(e) => setForm({ ...form, max_discount: e.target.value ? Number(e.target.value) : null })}
                                        placeholder="No cap"
                                        min={0}
                                    />
                                </div>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className="text-xs">Usage Limit</Label>
                                <Input
                                    type="number"
                                    value={form.usage_limit || ''}
                                    onChange={(e) => setForm({ ...form, usage_limit: e.target.value ? Number(e.target.value) : null })}
                                    placeholder="Unlimited"
                                    min={1}
                                />
                            </div>
                            <div className="flex items-end gap-2 pb-1">
                                <label className="flex items-center gap-2 text-sm cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={form.is_active}
                                        onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                                        className="rounded"
                                    />
                                    Active
                                </label>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className="text-xs">Valid From</Label>
                                <Input
                                    type="date"
                                    value={form.valid_from}
                                    onChange={(e) => setForm({ ...form, valid_from: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label className="text-xs">Valid Until</Label>
                                <Input
                                    type="date"
                                    value={form.valid_until}
                                    onChange={(e) => setForm({ ...form, valid_until: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={saving || !form.code || !form.discount_value}>
                            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {editingId ? 'Save Changes' : 'Create Voucher'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
