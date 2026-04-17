import { runSteps } from "./runner.ts"

type AgentContext = {
  projectDir: string
  log: (message: string) => void
}

export async function tamTarama(context: AgentContext): Promise<void> {
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
