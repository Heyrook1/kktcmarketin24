import { runCommand, runNodeScript } from "./shared"

export async function tamTarama() {
  await runNodeScript("scripts/qa-smoke.mjs", "QA")
}

export async function kaliteKontrol() {
  await runCommand("pnpm", ["typecheck"], "QA")
  await runCommand("pnpm", ["lint"], "QA")
  await runNodeScript("scripts/qa-smoke.mjs", "QA")
}
