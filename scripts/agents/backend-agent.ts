import type { AgentContext } from "./types.ts"
import { projeKomutuCalistir } from "./command-runner.ts"

export function createBackendAgent(context: AgentContext) {
  return {
    async apiSagligi(): Promise<void> {
      await projeKomutuCalistir(context, {
        command: "npm run typecheck",
      })
    },
    async supabaseKontrol(): Promise<void> {
      await projeKomutuCalistir(context, {
        command: "node ./scripts/check-connections.mjs",
      })
    },
  }
}
