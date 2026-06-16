import { appendFileSync, existsSync, mkdirSync } from "node:fs"
import path from "node:path"
import process from "node:process"
import { fileURLToPath } from "node:url"

import { createBackendAgent } from "./agents/backend-agent.ts"
import { createFrontendAgent } from "./agents/frontend-agent.ts"
import { createQaAgent } from "./agents/qa-agent.ts"
import type { OrchestratorLogger } from "./agents/types.ts"

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const projectDirectory =
  process.env.PROJECT_DIR ?? path.resolve(scriptDirectory, "..")

const logDirectory = path.join(projectDirectory, "docs", "agent-logs")

const log: OrchestratorLogger = (message) => {
  const line = `[${new Date().toISOString()}] [ORCHESTRATOR] ${message}`
  process.stdout.write(`${line}\n`)

  if (!existsSync(logDirectory)) {
    mkdirSync(logDirectory, { recursive: true })
  }

  appendFileSync(path.join(logDirectory, "orchestrator.log"), `${line}\n`)
}

const ortakContext = {
  projectDirectory,
  log,
}

const qa = createQaAgent(ortakContext)
const backend = createBackendAgent(ortakContext)
const frontend = createFrontendAgent(ortakContext)

async function guvenliCalistir(isim: string, calismaFonksiyonu: () => Promise<void>): Promise<void> {
  try {
    log(`▶ ${isim}`)
    await calismaFonksiyonu()
    log(`✅ ${isim}`)
  } catch (error) {
    const mesaj =
      error instanceof Error ? error.message : "Bilinmeyen bir hata oluştu."
    log(`❌ ${isim} — ${mesaj}`)
  }
}

async function sabahRutini(): Promise<void> {
  log("=== SABAH RUTINI BASLIYOR ===")
  await guvenliCalistir("QA -> Site Taramasi", () => qa.tamTarama())
  await guvenliCalistir("Backend -> API Sagligi", () => backend.apiSagligi())
  log("=== SABAH RUTINI TAMAMLANDI ===")
}

async function ogleRutini(): Promise<void> {
  log("=== OGLE RUTINI BASLIYOR ===")
  await guvenliCalistir("Frontend -> UI Kontrol", () => frontend.uiKontrol())
  await guvenliCalistir("Backend -> Supabase Kontrol", () => backend.supabaseKontrol())
  log("=== OGLE RUTINI TAMAMLANDI ===")
}

async function geceRutini(): Promise<void> {
  log("=== GECE RUTINI BASLIYOR ===")
  await guvenliCalistir("Frontend -> Eksik Sayfalar", () => frontend.eksikSayfalar())
  await guvenliCalistir("QA -> Kalite Kontrol", () => qa.kaliteKontrol())
  log("=== GECE RUTINI TAMAMLANDI ===")
}

let sonSabahGunu = -1
let sonOgleGunu = -1
let sonGeceGunu = -1
let calismaDevamEdiyor = false

async function kontrolEt(): Promise<void> {
  if (calismaDevamEdiyor) {
    return
  }

  const simdi = new Date()
  const saat = simdi.getHours()
  const dakika = simdi.getMinutes()
  const gun = simdi.getDate()

  calismaDevamEdiyor = true

  try {
    if (saat === 9 && dakika === 0 && sonSabahGunu !== gun) {
      sonSabahGunu = gun
      await sabahRutini()
      return
    }

    if (saat === 14 && dakika === 0 && sonOgleGunu !== gun) {
      sonOgleGunu = gun
      await ogleRutini()
      return
    }

    if (saat === 22 && dakika === 0 && sonGeceGunu !== gun) {
      sonGeceGunu = gun
      await geceRutini()
    }
  } finally {
    calismaDevamEdiyor = false
  }
}

log("Marketin24 Yazilim Takimi baslatildi")
log(`Proje dizini: ${projectDirectory}`)
log("Calisma saatleri: 09:00 sabah | 14:00 ogle | 22:00 gece")
log("---------------------------------------------")
log("Ilk calistirma: sabah rutini hemen basliyor")

void sabahRutini()
  .then(() => {
    log("Ilk calistirma tamamlandi. Zamanli gorevler bekleniyor.")
  })
  .catch((error) => {
    const mesaj =
      error instanceof Error ? error.message : "Bilinmeyen bir hata olustu."
    log(`Ilk calistirma hatasi: ${mesaj}`)
  })

setInterval(() => {
  void kontrolEt()
}, 60 * 1000)
