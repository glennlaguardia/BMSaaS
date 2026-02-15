'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Save, Clock, Users, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';

interface BookingRules {
  booking_expiry_hours: number;
  min_advance_booking_days: number;
  max_advance_booking_days: number;
  require_payment_proof: boolean;
  allow_day_tours: boolean;
  day_tour_fee_adult: number;
  day_tour_fee_child: number;
  day_tour_max_capacity: number;
  check_in_time: string;
  check_out_time: string;
}

const DEFAULT_RULES: BookingRules = {
  booking_expiry_hours: 48,
  min_advance_booking_days: 1,
  max_advance_booking_days: 90,
  require_payment_proof: true,
  allow_day_tours: true,
  day_tour_fee_adult: 150,
  day_tour_fee_child: 100,
  day_tour_max_capacity: 50,
  check_in_time: '14:00',
  check_out_time: '12:00',
};

export default function SettingsPage() {
  const [rules, setRules] = useState<BookingRules>(DEFAULT_RULES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/admin/branding')
      .then(r => r.json())
      .then(data => {
        if (data.success && data.data?.booking_rules) {
          setRules({ ...DEFAULT_RULES, ...(data.data.booking_rules as Partial<BookingRules>) });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/branding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_rules: rules }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Settings saved');
      } else {
        toast.error('Failed to save settings');
      }
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-forest-500/35" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-forest-700">Settings</h1>
          <p className="text-sm text-forest-500/45 mt-1">Configure booking rules and resort policies</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-forest-500 hover:bg-forest-600">
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Settings
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Booking Timing */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4" /> Booking Timing
            </CardTitle>
            <CardDescription>Control booking windows and expiry</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Booking Expiry (hours)</Label>
              <Input
                type="number"
                value={rules.booking_expiry_hours}
                onChange={e => setRules({ ...rules, booking_expiry_hours: parseInt(e.target.value) || 48 })}
                className="mt-1"
                min={1}
                max={168}
              />
              <p className="text-xs text-forest-500/35 mt-1">Unpaid bookings expire after this many hours</p>
            </div>
            <div>
              <Label>Min Advance Booking (days)</Label>
              <Input
                type="number"
                value={rules.min_advance_booking_days}
                onChange={e => setRules({ ...rules, min_advance_booking_days: parseInt(e.target.value) || 1 })}
                className="mt-1"
                min={0}
                max={30}
              />
            </div>
            <div>
              <Label>Max Advance Booking (days)</Label>
              <Input
                type="number"
                value={rules.max_advance_booking_days}
                onChange={e => setRules({ ...rules, max_advance_booking_days: parseInt(e.target.value) || 90 })}
                className="mt-1"
                min={7}
                max={365}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Check-in Time</Label>
                <Input
                  type="time"
                  value={rules.check_in_time}
                  onChange={e => setRules({ ...rules, check_in_time: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Check-out Time</Label>
                <Input
                  type="time"
                  value={rules.check_out_time}
                  onChange={e => setRules({ ...rules, check_out_time: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Rules */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="w-4 h-4" /> Payment & Verification
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Require Payment Proof</Label>
                <p className="text-xs text-forest-500/35">Guests must upload proof of payment</p>
              </div>
              <Switch
                checked={rules.require_payment_proof}
                onCheckedChange={(v) => setRules({ ...rules, require_payment_proof: v })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Day Tour Settings */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4" /> Day Tour Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div>
                <Label>Enable Day Tours</Label>
                <p className="text-xs text-forest-500/35">Allow guests to book day tours</p>
              </div>
              <Switch
                checked={rules.allow_day_tours}
                onCheckedChange={(v) => setRules({ ...rules, allow_day_tours: v })}
              />
            </div>
            {rules.allow_day_tours && (
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <Label>Adult Fee (PHP)</Label>
                  <Input
                    type="number"
                    value={rules.day_tour_fee_adult}
                    onChange={e => setRules({ ...rules, day_tour_fee_adult: parseFloat(e.target.value) || 0 })}
                    className="mt-1"
                    min={0}
                  />
                </div>
                <div>
                  <Label>Child Fee (PHP)</Label>
                  <Input
                    type="number"
                    value={rules.day_tour_fee_child}
                    onChange={e => setRules({ ...rules, day_tour_fee_child: parseFloat(e.target.value) || 0 })}
                    className="mt-1"
                    min={0}
                  />
                </div>
                <div>
                  <Label>Max Daily Capacity</Label>
                  <Input
                    type="number"
                    value={rules.day_tour_max_capacity}
                    onChange={e => setRules({ ...rules, day_tour_max_capacity: parseInt(e.target.value) || 50 })}
                    className="mt-1"
                    min={1}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
