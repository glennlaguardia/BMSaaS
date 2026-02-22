'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Lock, Leaf } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Invalid credentials');
        setLoading(false);
        return;
      }

      router.push('/dashboard/overview');
      router.refresh();
    } catch {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-forest-700 px-4 relative overflow-hidden">
      {/* Background atmospheric layers */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-forest-500/40 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-amber-300/5 via-transparent to-transparent" />
      <div className="absolute inset-0 grain pointer-events-none opacity-40" />

      <div className="relative z-10 w-full max-w-sm">
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/[0.08]">
              <Leaf className="w-5 h-5 text-amber-300" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Taglucop Admin
          </h1>
          <p className="text-white/35 text-sm mt-1.5 font-medium">
            Sign in to manage your resort
          </p>
        </div>

        {/* Login card */}
        <div className="bg-white/[0.06] backdrop-blur-xl rounded-2xl border border-white/[0.08] p-7 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-white/50 text-xs font-semibold tracking-wider uppercase">
                Username
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="bg-white/[0.06] border-white/[0.1] text-white placeholder:text-white/25 focus:border-amber-300/40 focus:ring-amber-300/20 rounded-lg h-11"
                autoComplete="username"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white/50 text-xs font-semibold tracking-wider uppercase">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="bg-white/[0.06] border-white/[0.1] text-white placeholder:text-white/25 focus:border-amber-300/40 focus:ring-amber-300/20 rounded-lg h-11"
                autoComplete="current-password"
                required
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5">
                <p className="text-sm text-red-300 text-center font-medium">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              variant="amber"
              className="w-full rounded-lg h-11"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  Sign In
                </>
              )}
            </Button>
          </form>
        </div>

        <p className="text-center text-white/15 text-xs mt-6 font-medium">
          Powered by BudaBook
        </p>
      </div>
    </div>
  );
}
