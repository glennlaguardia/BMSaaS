import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const files = [
  '001_create_tables.sql',
  '002_rls_policies.sql',
  '003_functions.sql',
  '004_seed_taglucop.sql',
];

let sql = `-- BudaBook Full Migration + Seed (Auto-generated)
-- Run this in the Supabase Dashboard SQL Editor
-- ================================================

`;

for (const f of files) {
  const content = readFileSync(resolve(__dirname, 'migrations', f), 'utf-8');
  sql += content + '\n\n';
}

// Admin user with pre-computed bcrypt hash of 'T@gluc0p@dm1n!'
sql += `-- Admin user (username: TaglucopAdmin, password: T@gluc0p@dm1n!, bcrypt hashed)
INSERT INTO admin_users (id, tenant_id, username, email, password_hash, full_name, role, is_active)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-000000000002',
  'a1b2c3d4-e5f6-7890-abcd-000000000001',
  'TaglucopAdmin',
  'taglucopfarms@gmail.com',
  '$2b$12$5sJEpwLDuLKah7GBJFomne7P2PbQ/RyTLcqlSCum2L049cn4OLq5a',
  'Resort Admin',
  'resort_admin',
  true
)
ON CONFLICT (id) DO UPDATE SET username = EXCLUDED.username, password_hash = EXCLUDED.password_hash;
`;

writeFileSync(resolve(__dirname, 'full-migration.sql'), sql, 'utf-8');
console.log(`Written ${sql.length} characters to supabase/full-migration.sql`);
