import { mkdirSync, appendFileSync, existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import * as qa from "./agents/qa-agent.ts";
import * as backend from "./agents/backend-agent.ts";
import * as frontend from "./agents/frontend-agent.ts";

const currentFileDirectory = path.dirname(fileURLToPath(import.meta.url));
process.env.PROJECT_DIR =
  process.env.PROJECT_DIR ?? path.resolve(currentFileDirectory, "..");

const logDirectory = path.join(process.env.PROJECT_DIR, "docs", "agent-logs");
const orchestratorLogPath = path.join(logDirectory, "orchestrator.log");

function log(message: string): void {
  const line = `[${new Date().toISOString()}] [ORCHESTRATOR] ${message}`;
  process.stdout.write(`${line}\n`);

  if (!existsSync(logDirectory)) {
    mkdirSync(logDirectory, { recursive: true });
  }

  appendFileSync(orchestratorLogPath, `${line}\n`);
}

async function guvenliCalistir(isim: string, gorev: () => Promise<void>): Promise<void> {
  try {
    log(`> ${isim}`);
    await gorev();
    log(`[OK] ${isim}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log(`[ERR] ${isim} - ${errorMessage}`);
  }
}

async function sabahRutini(): Promise<void> {
  log("=== SABAH RUTINI BASLIYOR ===");
  await guvenliCalistir("QA -> Site Taramasi", qa.tamTarama);
  await guvenliCalistir("Backend -> API Sagligi", backend.apiSagligi);
  log("=== SABAH RUTINI TAMAMLANDI ===");
}

async function ogleRutini(): Promise<void> {
  log("=== OGLE RUTINI BASLIYOR ===");
  await guvenliCalistir("Frontend -> UI Kontrol", frontend.uiKontrol);
  await guvenliCalistir("Backend -> Supabase Kontrol", backend.supabaseKontrol);
  log("=== OGLE RUTINI TAMAMLANDI ===");
}

async function geceRutini(): Promise<void> {
  log("=== GECE RUTINI BASLIYOR ===");
  await guvenliCalistir("Frontend -> Eksik Sayfalar", frontend.eksikSayfalar);
  await guvenliCalistir("QA -> Kalite Kontrol", qa.kaliteKontrol);
  log("=== GECE RUTINI TAMAMLANDI ===");
}

let sonSabah = -1;
let sonOgle = -1;
let sonGece = -1;

function kontrol(): void {
  const simdi = new Date();
  const saat = simdi.getHours();
  const dakika = simdi.getMinutes();
  const gun = simdi.getDate();

  if (saat === 9 && dakika === 0 && sonSabah !== gun) {
    sonSabah = gun;
    void sabahRutini();
  }

  if (saat === 14 && dakika === 0 && sonOgle !== gun) {
    sonOgle = gun;
    void ogleRutini();
  }

  if (saat === 22 && dakika === 0 && sonGece !== gun) {
    sonGece = gun;
    void geceRutini();
  }
}

log("Marketin24 Yazilim Takimi baslatildi");
log(`Proje: ${process.env.PROJECT_DIR}`);
log("Calisma saatleri: 09:00 sabah | 14:00 ogle | 22:00 gece");
log("-----------------------------------------------");

async function baslat(): Promise<void> {
  log("Ilk calistirma hemen basliyor...");
  await sabahRutini();
  log("[OK] Ilk calistirma tamamlandi. Zamanli gorevler bekleniyor...");

  if (process.env.ORCHESTRATOR_RUN_ONCE === "1") {
    log("ORCHESTRATOR_RUN_ONCE=1, zamanlayici baslatilmadan cikiliyor.");
    return;
  }

  setInterval(kontrol, 60 * 1000);
}

void baslat().catch((error) => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  log(`Orkestrator baslatma hatasi: ${errorMessage}`);
  process.exitCode = 1;
});
