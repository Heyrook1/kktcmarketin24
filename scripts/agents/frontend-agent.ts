type AgentContext = {
  projectDir: string
  log: (message: string) => void
}

async function loadRunner(): Promise<typeof import("./runner")> {
  return import(new URL("./runner.ts", import.meta.url).href)
}

export async function uiKontrol(context: AgentContext): Promise<void> {
  const { runSteps } = await loadRunner()
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
  const { runSteps } = await loadRunner()
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
