import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadEnvLocal() {
  const envPath = resolve(process.cwd(), ".env.local");
  const envContent = readFileSync(envPath, "utf-8");

  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    process.env[key] = val;
  }
}

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  const password = process.argv[3]?.trim();

  if (!email || !password) {
    console.error("Usage: node scripts/dev-set-super-admin-password.mjs <email> <newPassword>");
    process.exit(1);
  }

  loadEnvLocal();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRole) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
    process.exit(1);
  }

  const admin = createClient(supabaseUrl, serviceRole, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: listData, error: listError } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (listError) {
    console.error("Failed to list users:", listError.message);
    process.exit(1);
  }

  const user = listData?.users?.find((u) => (u.email ?? "").toLowerCase() === email);
  if (!user) {
    console.error(`No auth user found for: ${email}`);
    process.exit(1);
  }

  const { error: updateError } = await admin.auth.admin.updateUserById(user.id, {
    password,
    email_confirm: true,
  });
  if (updateError) {
    console.error("Failed to update password:", updateError.message);
    process.exit(1);
  }

  const { error: promoteError } = await admin.rpc("promote_super_admin", { target_email: email });
  if (promoteError) {
    console.error("Password updated, but super_admin promotion failed:", promoteError.message);
    process.exit(2);
  }

  console.log(`Success. Password updated and super_admin ensured for ${email}.`);
}

main().catch((error) => {
  console.error("Unexpected error:", error instanceof Error ? error.message : String(error));
  process.exit(1);
});
