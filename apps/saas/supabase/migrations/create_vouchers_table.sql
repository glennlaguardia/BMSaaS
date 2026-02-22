-- ===================================================================
-- Vouchers table for BudaBook multi-tenant voucher management
-- ===================================================================

CREATE TABLE IF NOT EXISTS public.vouchers (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id     uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  code          text NOT NULL,
  description   text,
  discount_type text NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value numeric(10,2) NOT NULL CHECK (discount_value > 0),
  min_booking_amount numeric(10,2) DEFAULT 0,
  max_discount   numeric(10,2),  -- cap for percentage discounts
  usage_limit    int,            -- NULL = unlimited
  times_used     int NOT NULL DEFAULT 0,
  valid_from     date,
  valid_until    date,
  applies_to     text NOT NULL DEFAULT 'both' CHECK (applies_to IN ('overnight', 'day_tour', 'both')),
  is_active      boolean NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),

  -- Unique code per tenant
  CONSTRAINT vouchers_tenant_code_unique UNIQUE (tenant_id, code)
);

-- Index for quick lookups by tenant + active
CREATE INDEX IF NOT EXISTS idx_vouchers_tenant_active
  ON public.vouchers (tenant_id, is_active)
  WHERE is_active = true;

-- Index for code lookups during validation
CREATE INDEX IF NOT EXISTS idx_vouchers_code_lookup
  ON public.vouchers (tenant_id, code)
  WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;

-- RLS policy: service role bypass (admin operations use service role client)
CREATE POLICY "Service role has full access to vouchers"
  ON public.vouchers
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_vouchers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_vouchers_updated_at
  BEFORE UPDATE ON public.vouchers
  FOR EACH ROW
  EXECUTE FUNCTION update_vouchers_updated_at();
