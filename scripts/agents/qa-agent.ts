import { runCommand } from "./process-runner.ts";

export async function tamTarama(): Promise<void> {
  await runCommand({
    command: "npm",
    args: ["run", "test:qa"],
    label: "QA tam tarama",
  });
}

export async function kaliteKontrol(): Promise<void> {
  await runCommand({
    command: "npm",
    args: ["run", "test:qa"],
    label: "QA kalite kontrol",
  });
}
