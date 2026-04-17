import { runSteps } from "./runner.ts"

type AgentContext = {
  projectDir: string
  log: (message: string) => void
}

export async function apiSagligi(context: AgentContext): Promise<void> {
  await runSteps(
    [
      {
        command: "$PM",
        args: ["run", "typecheck"],
        label: "API typecheck",
      },
    ],
    context,
  )
}

export async function supabaseKontrol(context: AgentContext): Promise<void> {
  await runSteps(
    [
      {
        command: "node",
        args: ["./scripts/check-connections.mjs"],
        label: "Supabase baglanti kontrolu",
      },
    ],
    context,
  )
}

const backendAgent = {
  apiSagligi,
  supabaseKontrol,
}

export default backendAgent
