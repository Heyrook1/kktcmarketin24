import type { AgentContext } from "./types.ts"
import { projeKomutuCalistir } from "./command-runner.ts"

export function createFrontendAgent(context: AgentContext) {
  return {
    async uiKontrol(): Promise<void> {
      await projeKomutuCalistir(context, {
        command: "npm run test:qa",
      })
    },
    async eksikSayfalar(): Promise<void> {
      await projeKomutuCalistir(context, {
        command: "npm run typecheck",
      })
    },
  }
}
