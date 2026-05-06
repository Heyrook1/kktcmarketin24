#!/usr/bin/env node
import { existsSync, mkdirSync, appendFileSync, readFileSync } from "node:fs"
import path from "node:path"

import { apiSagligi, supabaseKontrol } from "./agents/backend-agent"
import { type AgentContext, detectPackageManager, toErrorMessage } from "./agents/context"
import { eksikSayfalar, uiKontrol } from "./agents/frontend-agent"
import { kaliteKontrol, tamTarama } from "./agents/qa-agent"

const defaultProjectDir = process.cwd()
const projectDir = process.env.PROJECT_DIR || defaultProjectDir
const logDir = path.join(projectDir, "docs", "agent-logs")
const orchestratorLogPath = path.join(logDir, "orchestrator.log")

loadEnvFile(path.join(projectDir, ".env"))
loadEnvFile(path.join(projectDir, ".env.local"))

const packageManager = detectPackageManager(projectDir)

const context: AgentContext = {
  projectDir,
  packageManager,
  env: {
    ...process.env,
    PROJECT_DIR: projectDir,
  },
  log,
}

let lastMorningDay = -1
let lastNoonDay = -1
let lastNightDay = -1
let activeRoutine: Promise<void> | null = null

function log(message: string): void {
  const line = `[${new Date().toISOString()}] [ORCHESTRATOR] ${message}`
  process.stdout.write(`${line}\n`)

  if (!existsSync(logDir)) mkdirSync(logDir, { recursive: true })
  appendFileSync(orchestratorLogPath, `${line}\n`, "utf8")
}

function loadEnvFile(envPath: string): void {
  if (!existsSync(envPath)) return

  const envContent = readFileSync(envPath, "utf8")

  for (const line of envContent.split("\n")) {
    const trimmedLine = line.trim()
    if (!trimmedLine || trimmedLine.startsWith("#")) continue

    const separatorIndex = trimmedLine.indexOf("=")
    if (separatorIndex === -1) continue

    const key = trimmedLine.slice(0, separatorIndex).trim()
    const rawValue = trimmedLine.slice(separatorIndex + 1).trim()
    const value = rawValue.replace(/^["']|["']$/g, "")

    process.env[key] ??= value
  }
}

async function runSafely(name: string, action: () => Promise<void>): Promise<void> {
  try {
    log(`▶ ${name}`)
    await action()
    log(`✓ ${name}`)
  } catch (error) {
    log(`✗ ${name} - ${toErrorMessage(error)}`)
  }
}

async function morningRoutine(): Promise<void> {
  log("=== SABAH RUTINI BASLIYOR ===")
  await runSafely("QA -> Site taramasi", () => tamTarama(context))
  await runSafely("Backend -> API sagligi", () => apiSagligi(context))
  log("=== SABAH RUTINI TAMAMLANDI ===")
}

async function noonRoutine(): Promise<void> {
  log("=== OGLE RUTINI BASLIYOR ===")
  await runSafely("Frontend -> UI kontrol", () => uiKontrol(context))
  await runSafely("Backend -> Supabase kontrol", () => supabaseKontrol(context))
  log("=== OGLE RUTINI TAMAMLANDI ===")
}

async function nightRoutine(): Promise<void> {
  log("=== GECE RUTINI BASLIYOR ===")
  await runSafely("Frontend -> Eksik sayfalar", () => eksikSayfalar(context))
  await runSafely("QA -> Kalite kontrol", () => kaliteKontrol(context))
  log("=== GECE RUTINI TAMAMLANDI ===")
}

function startRoutine(routine: () => Promise<void>): void {
  if (activeRoutine) {
    log("Devam eden rutin oldugu icin yeni tetikleme atlandi.")
    return
  }

  activeRoutine = routine().finally(() => {
    activeRoutine = null
  })
}

function checkSchedule(): void {
  const now = new Date()
  const hour = now.getHours()
  const minute = now.getMinutes()
  const dayKey = Number(
    `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`,
  )

  if (hour === 9 && minute === 0 && lastMorningDay !== dayKey) {
    lastMorningDay = dayKey
    startRoutine(morningRoutine)
  }

  if (hour === 14 && minute === 0 && lastNoonDay !== dayKey) {
    lastNoonDay = dayKey
    startRoutine(noonRoutine)
  }

  if (hour === 22 && minute === 0 && lastNightDay !== dayKey) {
    lastNightDay = dayKey
    startRoutine(nightRoutine)
  }
}

log("Marketin24 Yazilim Takimi baslatildi")
log(`Proje: ${projectDir}`)
log("Calisma saatleri: 09:00 sabah - 14:00 ogle - 22:00 gece")
log("-------------------------------------------------")

log("Ilk calistirma - hemen basliyor...")
startRoutine(async () => {
  await morningRoutine()
  log("Ilk calistirma tamamlandi. Zamanli gorevler bekleniyor...")
})

setInterval(checkSchedule, 60 * 1000)
