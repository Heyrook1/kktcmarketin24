type AgentContext = {
  projectDir: string
  log: (message: string) => void
}

async function loadRunner(): Promise<typeof import("./runner")> {
  return import(new URL("./runner.ts", import.meta.url).href)
}

export async function tamTarama(context: AgentContext): Promise<void> {
  const { runSteps } = await loadRunner()
  await runSteps(
    [
      {
        command: "$PM",
        args: ["run", "test:qa"],
        label: "QA smoke taramasi",
      },
    ],
    context,
  )
}

export async function kaliteKontrol(context: AgentContext): Promise<void> {
  const { runSteps } = await loadRunner()
  await runSteps(
    [
      {
        command: "$PM",
        args: ["run", "lint"],
        label: "Lint kontrolu",
      },
      {
        command: "$PM",
        args: ["run", "typecheck"],
        label: "TypeScript typecheck",
      },
    ],
    context,
  )
}

const qaAgent = {
  tamTarama,
  kaliteKontrol,
}

export default qaAgent
