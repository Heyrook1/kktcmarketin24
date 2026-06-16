#!/usr/bin/env node

const fs: typeof import("node:fs") = require("node:fs")
const path: typeof import("node:path") = require("node:path")

type AgentModule = Record<string, () => Promise<void>>

type RoutineName = "sabah" | "ogle" | "gece"

const projectDir = process.env.PROJECT_DIR ?? path.join(__dirname, "..")
process.env.PROJECT_DIR = projectDir

loadEnvFile(path.join(projectDir, ".env"))
loadEnvFile(path.join(projectDir, ".env.local"))

const qa = require("./agents/qa-agent.cts") as AgentModule
const backend = require("./agents/backend-agent.cts") as AgentModule
const frontend = require("./agents/frontend-agent.cts") as AgentModule

const logDir = path.join(projectDir, "docs", "agent-logs")
const hasRunByRoutine: Record<RoutineName, number> = {
  sabah: -1,
  ogle: -1,
  gece: -1,
}

function loadEnvFile(filePath: string): void {
  if (!fs.existsSync(filePath)) {
    return
  }

  const lines = fs.readFileSync(filePath, "utf8").split("\n")

  for (const line of lines) {
    const trimmedLine = line.trim()

    if (!trimmedLine || trimmedLine.startsWith("#")) {
      continue
    }

    const separatorIndex = trimmedLine.indexOf("=")
    if (separatorIndex === -1) {
      continue
    }

    const key = trimmedLine.slice(0, separatorIndex).trim()
    const rawValue = trimmedLine.slice(separatorIndex + 1).trim()

    if (process.env[key] !== undefined) {
      continue
    }

    process.env[key] = rawValue.replace(/^["']|["']$/g, "")
  }
}

function log(message: string): void {
  const line = `[${new Date().toISOString()}] [ORCHESTRATOR] ${message}`

  process.stdout.write(`${line}\n`)
  fs.mkdirSync(logDir, { recursive: true })
  fs.appendFileSync(path.join(logDir, "orchestrator.log"), `${line}\n`)
}

async function guvenliCalistir(isim: string, fn: () => Promise<void>): Promise<void> {
  try {
    log(`▶ ${isim}`)
    await fn()
    log(`✅ ${isim}`)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    log(`❌ ${isim} — ${message}`)
  }
}

async function sabahRutini(): Promise<void> {
  log("=== SABAH RUTİNİ BAŞLIYOR ===")
  await guvenliCalistir("QA → Site Taraması", qa.tamTarama)
  await guvenliCalistir("Backend → API Sağlığı", backend.apiSagligi)
  log("=== SABAH RUTİNİ TAMAMLANDI ===")
}

async function ogleRutini(): Promise<void> {
  log("=== ÖĞLE RUTİNİ BAŞLIYOR ===")
  await guvenliCalistir("Frontend → UI Kontrol", frontend.uiKontrol)
  await guvenliCalistir("Backend → Supabase Kontrol", backend.supabaseKontrol)
  log("=== ÖĞLE RUTİNİ TAMAMLANDI ===")
}

async function geceRutini(): Promise<void> {
  log("=== GECE RUTİNİ BAŞLIYOR ===")
  await guvenliCalistir("Frontend → Eksik Sayfalar", frontend.eksikSayfalar)
  await guvenliCalistir("QA → Kalite Kontrol", qa.kaliteKontrol)
  log("=== GECE RUTİNİ TAMAMLANDI ===")
}

function kontrol(): void {
  const simdi = new Date()
  const saat = simdi.getHours()
  const dakika = simdi.getMinutes()
  const gun = simdi.getDate()

  if (saat === 9 && dakika === 0 && hasRunByRoutine.sabah !== gun) {
    hasRunByRoutine.sabah = gun
    void sabahRutini()
  }

  if (saat === 14 && dakika === 0 && hasRunByRoutine.ogle !== gun) {
    hasRunByRoutine.ogle = gun
    void ogleRutini()
  }

  if (saat === 22 && dakika === 0 && hasRunByRoutine.gece !== gun) {
    hasRunByRoutine.gece = gun
    void geceRutini()
  }
}

async function runOnce(): Promise<void> {
  await sabahRutini()
  await ogleRutini()
  await geceRutini()
}

async function main(): Promise<void> {
  log("🤖 Marketin24 Yazılım Takımı başlatıldı")
  log(`📁 Proje: ${projectDir}`)
  log("📅 Çalışma saatleri: 09:00 sabah · 14:00 öğle · 22:00 gece")
  log("─────────────────────────────────────────────────")

  if (process.argv.includes("--once")) {
    log("🚀 Tek seferlik çalışma başlıyor...")
    await runOnce()
    log("✅ Tek seferlik çalışma tamamlandı.")
    return
  }

  log("🚀 İlk çalıştırma — sabah rutini hemen başlıyor...")
  await sabahRutini()
  log("✅ İlk çalıştırma tamamlandı. Zamanlı görevler bekleniyor...")

  setInterval(kontrol, 60 * 1000)
}

void main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error)
  log(`Orchestrator durdu: ${message}`)
  process.exitCode = 1
})
