import type { AgentContext } from "./types.ts"
import { projeKomutuCalistir } from "./command-runner.ts"

export function createQaAgent(context: AgentContext) {
  return {
    async tamTarama(): Promise<void> {
      await projeKomutuCalistir(context, {
        command: "npm run test:qa",
      })
    },
    async kaliteKontrol(): Promise<void> {
      await projeKomutuCalistir(context, {
        command: "npm run test:qa && npm run typecheck",
      })
    },
  }
}
