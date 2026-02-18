-- API keys for external client websites to authenticate with the SaaS REST API
CREATE TABLE IF NOT EXISTS api_keys (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  key_hash    text NOT NULL,
  key_prefix  varchar(12) NOT NULL,
  name        varchar(100) NOT NULL DEFAULT 'Default',
  scopes      text[] DEFAULT '{read}',
  is_active   boolean DEFAULT true,
  last_used   timestamptz,
  created_at  timestamptz DEFAULT now(),
  expires_at  timestamptz
);

CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON api_keys(key_prefix) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_api_keys_tenant ON api_keys(tenant_id);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only" ON api_keys FOR ALL USING (false);
