#!/usr/bin/env node
import { appendFile, mkdir, readFile } from "node:fs/promises"
import path from "node:path"
import process from "node:process"

import * as backend from "./agents/backend-agent"
import * as frontend from "./agents/frontend-agent"
import * as qa from "./agents/qa-agent"
import { type AgentContext, ensureLogDir } from "./agents/shared"

const projectDir = path.resolve(process.env.PROJECT_DIR ?? process.cwd())
const logDir = path.join(projectDir, "docs", "agent-logs")

let lastMorningRun = -1
let lastNoonRun = -1
let lastNightRun = -1
let activeRoutine: Promise<void> | null = null

async function loadLocalEnv(): Promise<void> {
  const envPath = path.join(projectDir, ".env")

  try {
    const content = await readFile(envPath, "utf8")
    for (const line of content.split(/\r?\n/)) {
      const trimmedLine = line.trim()
      if (!trimmedLine || trimmedLine.startsWith("#")) {
        continue
      }

      const separatorIndex = trimmedLine.indexOf("=")
      if (separatorIndex === -1) {
        continue
      }

      const key = trimmedLine.slice(0, separatorIndex).trim()
      const value = trimmedLine.slice(separatorIndex + 1).trim().replace(/^["']|["']$/g, "")
      if (key && process.env[key] === undefined) {
        process.env[key] = value
      }
    }
  } catch {
    // Local .env files are optional for the orchestrator.
  }
}

async function log(message: string): Promise<void> {
  const line = `[${new Date().toISOString()}] [ORCHESTRATOR] ${message}`
  process.stdout.write(`${line}\n`)
  await mkdir(logDir, { recursive: true })
  await appendFile(path.join(logDir, "orchestrator.log"), `${line}\n`, "utf8")
}

function createContext(): AgentContext {
  return {
    log,
    logDir,
    projectDir,
  }
}

async function sabahRutini(): Promise<void> {
  const context = createContext()
  await log("=== SABAH RUTINI BASLIYOR ===")
  await guvenliCalistir("QA -> Site Taramasi", () => qa.tamTarama(context))
  await guvenliCalistir("Backend -> API Sagligi", () => backend.apiSagligi(context))
  await log("=== SABAH RUTINI TAMAMLANDI ===")
}

async function ogleRutini(): Promise<void> {
  const context = createContext()
  await log("=== OGLE RUTINI BASLIYOR ===")
  await guvenliCalistir("Frontend -> UI Kontrol", () => frontend.uiKontrol(context))
  await guvenliCalistir("Backend -> Supabase Kontrol", () => backend.supabaseKontrol(context))
  await log("=== OGLE RUTINI TAMAMLANDI ===")
}

async function geceRutini(): Promise<void> {
  const context = createContext()
  await log("=== GECE RUTINI BASLIYOR ===")
  await guvenliCalistir("Frontend -> Eksik Sayfalar", () => frontend.eksikSayfalar(context))
  await guvenliCalistir("QA -> Kalite Kontrol", () => qa.kaliteKontrol(context))
  await log("=== GECE RUTINI TAMAMLANDI ===")
}

async function guvenliCalistir(name: string, task: () => Promise<void>): Promise<void> {
  try {
    await log(`START ${name}`)
    await task()
    await log(`PASS ${name}`)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Bilinmeyen hata"
    await log(`FAIL ${name} - ${message}`)
  }
}

function scheduleRoutine(task: () => Promise<void>): void {
  if (activeRoutine) {
    void log("Zamanli gorev atlandi; onceki rutin devam ediyor.").catch(() => undefined)
    return
  }

  activeRoutine = task().finally(() => {
    activeRoutine = null
  })
  void activeRoutine.catch(async (error) => {
    const message = error instanceof Error ? error.message : "Bilinmeyen hata"
    await log(`Zamanli rutin tamamlanamadi: ${message}`)
  })
}

function kontrol(): void {
  const now = new Date()
  const hour = now.getHours()
  const minute = now.getMinutes()
  const day = now.getDate()

  if (hour === 9 && minute === 0 && lastMorningRun !== day) {
    lastMorningRun = day
    scheduleRoutine(sabahRutini)
  }

  if (hour === 14 && minute === 0 && lastNoonRun !== day) {
    lastNoonRun = day
    scheduleRoutine(ogleRutini)
  }

  if (hour === 22 && minute === 0 && lastNightRun !== day) {
    lastNightRun = day
    scheduleRoutine(geceRutini)
  }
}

async function main(): Promise<void> {
  await loadLocalEnv()
  await ensureLogDir(logDir)
  const runOnce = process.argv.includes("--once") || process.env.ORCHESTRATOR_ONCE === "1"

  await log("Marketin24 Yazilim Takimi baslatildi")
  await log(`Proje: ${projectDir}`)
  await log("Calisma saatleri: 09:00 sabah | 14:00 ogle | 22:00 gece")
  await log("Ilk calistirma hemen basliyor...")

  activeRoutine = sabahRutini().finally(() => {
    activeRoutine = null
  })
  await activeRoutine
  await log("Ilk calistirma tamamlandi. Zamanli gorevler bekleniyor...")

  if (runOnce) {
    return
  }

  setInterval(kontrol, 60 * 1000)
}

export { geceRutini, kontrol, ogleRutini, sabahRutini }

void main().catch(async (error) => {
  const message = error instanceof Error ? error.message : "Bilinmeyen hata"
  await log(`Orchestrator baslatilamadi: ${message}`)
  process.exit(1)
})
