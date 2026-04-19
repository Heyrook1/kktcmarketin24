import { runNodeScript } from "./shared"

export async function apiSagligi(): Promise<void> {
  await runNodeScript("scripts/check-connections.mjs", "BACKEND")
}

export async function supabaseKontrol(): Promise<void> {
  await runNodeScript("scripts/check-connections.mjs", "BACKEND")
}
