import path from "node:path";

import { createBackendAgent } from "./agents/backend-agent";
import { createFrontendAgent } from "./agents/frontend-agent";
import { createQaAgent } from "./agents/qa-agent";
import {
  createLogger,
  createScopedLogger,
  getDateKey,
  loadEnvironmentFiles,
  resolveProjectDirectory,
  type Logger,
} from "./core";

const projectDirectory = resolveProjectDirectory();
process.env.PROJECT_DIR = projectDirectory;
loadEnvironmentFiles(projectDirectory);

const logDirectory = path.join(projectDirectory, "docs", "agent-logs");
const orchestratorLog = createLogger(logDirectory, "ORCHESTRATOR");

const qa = createQaAgent({
  projectDirectory,
  log: createScopedLogger(orchestratorLog, "QA"),
});

const backend = createBackendAgent({
  projectDirectory,
  log: createScopedLogger(orchestratorLog, "BACKEND"),
});

const frontend = createFrontendAgent({
  projectDirectory,
  log: createScopedLogger(orchestratorLog, "FRONTEND"),
});

let sonSabahGunu = "";
let sonOgleGunu = "";
let sonGeceGunu = "";
let kontrolCalisiyor = false;

async function guvenliCalistir(isim: string, gorev: () => Promise<void>, log: Logger): Promise<void> {
  try {
    log(`Basladi: ${isim}`);
    await gorev();
    log(`Tamamlandi: ${isim}`);
  } catch (error) {
    const hataMesaji = error instanceof Error ? error.message : String(error);
    log(`Hata: ${isim} -> ${hataMesaji}`);
  }
}

async function sabahRutini(log: Logger): Promise<void> {
  log("=== Sabah rutini basliyor ===");
  await guvenliCalistir("QA -> Site Taramasi", () => qa.tamTarama(), log);
  await guvenliCalistir("Backend -> API Sagligi", () => backend.apiSagligi(), log);
  log("=== Sabah rutini tamamlandi ===");
}

async function ogleRutini(log: Logger): Promise<void> {
  log("=== Ogle rutini basliyor ===");
  await guvenliCalistir("Frontend -> UI Kontrol", () => frontend.uiKontrol(), log);
  await guvenliCalistir("Backend -> Supabase Kontrol", () => backend.supabaseKontrol(), log);
  log("=== Ogle rutini tamamlandi ===");
}

async function geceRutini(log: Logger): Promise<void> {
  log("=== Gece rutini basliyor ===");
  await guvenliCalistir("Frontend -> Eksik Sayfalar", () => frontend.eksikSayfalar(), log);
  await guvenliCalistir("QA -> Kalite Kontrol", () => qa.kaliteKontrol(), log);
  log("=== Gece rutini tamamlandi ===");
}

async function kontrolEt(log: Logger): Promise<void> {
  if (kontrolCalisiyor) {
    log("Zamanlayici kontrolu atlandi: onceki tur hala calisiyor.");
    return;
  }

  kontrolCalisiyor = true;

  try {
    const simdi = new Date();
    const saat = simdi.getHours();
    const dakika = simdi.getMinutes();
    const gunAnahtari = getDateKey(simdi);

    if (saat === 9 && dakika === 0 && sonSabahGunu !== gunAnahtari) {
      sonSabahGunu = gunAnahtari;
      await sabahRutini(log);
      return;
    }

    if (saat === 14 && dakika === 0 && sonOgleGunu !== gunAnahtari) {
      sonOgleGunu = gunAnahtari;
      await ogleRutini(log);
      return;
    }

    if (saat === 22 && dakika === 0 && sonGeceGunu !== gunAnahtari) {
      sonGeceGunu = gunAnahtari;
      await geceRutini(log);
    }
  } finally {
    kontrolCalisiyor = false;
  }
}

function logBaslangicMesajlari(log: Logger): void {
  log("Marketin24 yazilim takimi baslatildi");
  log(`Proje dizini: ${projectDirectory}`);
  log("Calisma saatleri: 09:00 sabah | 14:00 ogle | 22:00 gece");
}

function kurGlobalHataYakalayicilar(log: Logger): void {
  process.on("uncaughtException", (error: Error) => {
    log(`Yakalanmamis hata: ${error.message}`);
  });

  process.on("unhandledRejection", (reason: unknown) => {
    const mesaj = reason instanceof Error ? reason.message : String(reason);
    log(`Beklenmeyen promise hatasi: ${mesaj}`);
  });
}

async function baslat(): Promise<void> {
  logBaslangicMesajlari(orchestratorLog);
  kurGlobalHataYakalayicilar(orchestratorLog);

  orchestratorLog("Ilk calistirma basliyor");
  await sabahRutini(orchestratorLog);
  sonSabahGunu = getDateKey(new Date());
  orchestratorLog("Ilk calistirma tamamlandi. Zamanli gorevler bekleniyor.");

  setInterval(() => {
    void kontrolEt(orchestratorLog);
  }, 60 * 1000);
}

void baslat();
