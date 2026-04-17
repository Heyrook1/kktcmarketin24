import { runSteps } from "./runner.ts"

type AgentContext = {
  projectDir: string
  log: (message: string) => void
}

export async function uiKontrol(context: AgentContext): Promise<void> {
  await runSteps(
    [
      {
        command: "$PM",
        args: ["run", "build"],
        label: "UI derleme kontrolu",
      },
    ],
    context,
  )
}

export async function eksikSayfalar(context: AgentContext): Promise<void> {
  await runSteps(
    [
      {
        command: "$PM",
        args: ["run", "typecheck"],
        label: "Sayfa tipi eksikligi kontrolu",
      },
    ],
    context,
  )
}

const frontendAgent = {
  uiKontrol,
  eksikSayfalar,
}

export default frontendAgent
