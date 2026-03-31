import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load .env.local manually
const envPath = resolve(process.cwd(), '.env.local');
const envContent = readFileSync(envPath, 'utf-8');
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx).trim();
  const val = trimmed.slice(eqIdx + 1).trim();
  process.env[key] = val;
}

const ok  = (label) => console.log(`  ✅ ${label}`);
const fail = (label, err) => console.log(`  ❌ ${label}: ${err?.message ?? err}`);

// ── 1. Supabase REST ping ─────────────────────────────────────────────────────
async function checkSupabase() {
  console.log('\n📡 Supabase');
  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return fail('Supabase', 'Missing env vars');
  try {
    const res = await fetch(`${url}/rest/v1/`, {
      headers: { apikey: anon, Authorization: `Bearer ${anon}` },
    });
    if (res.ok || res.status === 200 || res.status === 404) {
      ok(`Connected  →  ${url}`);
    } else {
      fail('Supabase REST', `HTTP ${res.status}`);
    }
  } catch (e) { fail('Supabase', e); }
}

// ── 2. Upstash Redis PING ─────────────────────────────────────────────────────
async function checkRedis() {
  console.log('\n🔴 Upstash Redis');
  const restUrl   = process.env.KV_REST_API_URL;
  const restToken = process.env.KV_REST_API_TOKEN;
  if (!restUrl || !restToken) return fail('Redis', 'Missing env vars');
  try {
    const res  = await fetch(`${restUrl}/ping`, {
      headers: { Authorization: `Bearer ${restToken}` },
    });
    const json = await res.json();
    if (json?.result === 'PONG') {
      ok(`Connected  →  ${restUrl}`);
    } else {
      fail('Redis PING', JSON.stringify(json));
    }
  } catch (e) { fail('Redis', e); }
}

// ── 3. Vercel Blob ────────────────────────────────────────────────────────────
async function checkBlob() {
  console.log('\n🗂️  Vercel Blob');
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return fail('Blob', 'Missing env var');
  try {
    const res  = await fetch('https://blob.vercel-storage.com', {
      headers: { Authorization: `Bearer ${token}` },
    });
    // 200 or 405 both mean the token is accepted
    if (res.status === 200 || res.status === 405 || res.status === 404) {
      ok(`Token accepted  →  HTTP ${res.status}`);
    } else {
      const body = await res.text();
      fail('Blob', `HTTP ${res.status}: ${body.slice(0, 120)}`);
    }
  } catch (e) { fail('Blob', e); }
}

// ── 4. Postgres direct ───────────────────────────────────────────────────────
async function checkPostgres() {
  console.log('\n🐘 Postgres (Supabase)');
  // We use the Supabase REST API to validate postgres indirectly (no pg driver needed)
  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const svc  = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !svc) return fail('Postgres', 'Missing env vars');
  try {
    // Hit a guaranteed system table via Supabase RPC PostgREST
    const res = await fetch(`${url}/rest/v1/rpc/version`, {
      method: 'POST',
      headers: {
        apikey: svc,
        Authorization: `Bearer ${svc}`,
        'Content-Type': 'application/json',
      },
      body: '{}',
    });
    if (res.ok) {
      const ver = await res.text();
      ok(`Connected  →  ${ver.replace(/"/g, '').slice(0, 60)}`);
    } else if (res.status === 404) {
      // No rpc/version function — but connection works
      ok(`Connected  →  (rpc/version not defined, but auth succeeded)`);
    } else {
      fail('Postgres via REST', `HTTP ${res.status}`);
    }
  } catch (e) { fail('Postgres', e); }
}

console.log('══════════════════════════════════════');
console.log('  kktcmarketin24 — Connection Checker ');
console.log('══════════════════════════════════════');

await checkSupabase();
await checkRedis();
await checkBlob();
await checkPostgres();

console.log('\n══════════════════════════════════════\n');
