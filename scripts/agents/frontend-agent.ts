import { runCommand } from "./shared"

export async function uiKontrol() {
  await runCommand("pnpm", ["lint"], "FRONTEND")
}

export async function eksikSayfalar() {
  await runCommand("pnpm", ["typecheck"], "FRONTEND")
}
