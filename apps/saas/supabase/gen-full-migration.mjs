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

// Admin user with pre-computed bcrypt hash of 'epstein'
sql += `-- Admin user (password: epstein, bcrypt hashed)
INSERT INTO admin_users (id, tenant_id, username, email, password_hash, full_name, role, is_active)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-000000000002',
  'a1b2c3d4-e5f6-7890-abcd-000000000001',
  'epstein',
  'taglucopfarms@gmail.com',
  '$2b$12$W3.jB8g6yAKNYTsgHZEDMOFrc/p3HnUTM1yyPNXdDkdLnAqpUjlBi',
  'Resort Admin',
  'resort_admin',
  true
)
ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash;
`;

writeFileSync(resolve(__dirname, 'full-migration.sql'), sql, 'utf-8');
console.log(`Written ${sql.length} characters to supabase/full-migration.sql`);
