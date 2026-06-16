import { runCommand } from "./process-runner.ts";
import { ensureFilesExist } from "./file-checks.ts";

const backendApiHealthChecks = [
  "app/api/orders/[id]/status/route.ts",
  "app/api/vendor/orders/[id]/status/route.ts",
  "app/api/returns/route.ts",
  "app/api/notifications/order-placed/route.ts",
  "app/api/orders/notify/route.ts",
];

export async function apiSagligi(): Promise<void> {
  await ensureFilesExist({
    checkName: "Backend API saglik kontrolu",
    relativePaths: backendApiHealthChecks,
  });
}

export async function supabaseKontrol(): Promise<void> {
  await runCommand({
    command: "node",
    args: ["scripts/check-connections.mjs"],
    label: "Backend Supabase kontrolu",
  });
}
