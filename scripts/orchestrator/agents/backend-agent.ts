import path from "node:path";

import {
  loadEnvironmentFiles,
  readTextFile,
  runCommand,
  summarizeCommandOutput,
  type Logger,
} from "../core";

export interface BackendAgent {
  apiSagligi: () => Promise<void>;
  supabaseKontrol: () => Promise<void>;
}

interface BackendAgentDependencies {
  projectDirectory: string;
  log: Logger;
}

export function createBackendAgent({ projectDirectory, log }: BackendAgentDependencies): BackendAgent {
  async function apiSagligi(): Promise<void> {
    const saglikUclari = [
      "/api/currency",
      "/api/search",
      "/api/reliability/score",
    ];
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "http://localhost:3000";

    for (const uc of saglikUclari) {
      const hedefUrl = new URL(uc, baseUrl).toString();
      const yanit = await fetch(hedefUrl, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      if (yanit.ok) {
        log(`API saglik dogrulandi: ${hedefUrl} -> ${yanit.status}`);
        continue;
      }

      throw new Error(`API saglik hatasi: ${hedefUrl} -> HTTP ${yanit.status}`);
    }
  }

  async function supabaseKontrol(): Promise<void> {
    loadEnvironmentFiles(projectDirectory);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      throw new Error("Supabase baglanti degiskenleri eksik (.env.local)");
    }

    const supabaseRestYanit = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: "GET",
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
    });

    if (![200, 404].includes(supabaseRestYanit.status)) {
      throw new Error(`Supabase REST beklenmeyen HTTP durumu: ${supabaseRestYanit.status}`);
    }

    const kontrolScriptYolu = path.join(projectDirectory, "scripts", "check-connections.mjs");
    readTextFile(kontrolScriptYolu);

    const komutSonucu = await runCommand("node", [path.join("scripts", "check-connections.mjs")], {
      cwd: projectDirectory,
      env: process.env,
    });

    if (komutSonucu.exitCode === 0) {
      log("Supabase baglanti kontrolu basarili.");
      return;
    }

    const hataOzeti = summarizeCommandOutput(komutSonucu);
    throw new Error(`Supabase kontrol scripti basarisiz oldu. ${hataOzeti}`);
  }

  return {
    apiSagligi,
    supabaseKontrol,
  };
}
