import path from "node:path";

import { runCommand, summarizeCommandOutput, type Logger } from "../core";

export interface QaAgent {
  tamTarama: () => Promise<void>;
  kaliteKontrol: () => Promise<void>;
}

interface QaAgentDependencies {
  projectDirectory: string;
  log: Logger;
}

export function createQaAgent({ projectDirectory, log }: QaAgentDependencies): QaAgent {
  async function calistirKomut(isim: string, komut: string, argumanlar: string[]): Promise<void> {
    const sonuc = await runCommand(komut, argumanlar, { cwd: projectDirectory });
    if (sonuc.exitCode === 0) {
      log(`${isim} basarili.`);
      return;
    }

    const hataOzeti = summarizeCommandOutput(sonuc);
    throw new Error(`${isim} basarisiz oldu. ${hataOzeti}`);
  }

  async function tamTarama(): Promise<void> {
    await calistirKomut("QA smoke taramasi", "node", [path.join("scripts", "qa-smoke.mjs")]);
  }

  async function kaliteKontrol(): Promise<void> {
    await calistirKomut("ESLint kontrolu", "pnpm", ["lint"]);
    await calistirKomut("TypeScript tip kontrolu", "pnpm", ["typecheck"]);
  }

  return {
    tamTarama,
    kaliteKontrol,
  };
}
