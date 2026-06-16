type AgentContext = {
  projectDir: string
  log: (message: string) => void
}

async function loadRunner(): Promise<typeof import("./runner")> {
  return import(new URL("./runner.ts", import.meta.url).href)
}

export async function apiSagligi(context: AgentContext): Promise<void> {
  const { runSteps } = await loadRunner()
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
  const { runSteps } = await loadRunner()
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
