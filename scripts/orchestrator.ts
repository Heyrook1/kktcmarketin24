#!/usr/bin/env node

import fs from "node:fs"
import path from "node:path"

import * as backend from "./agents/backend-agent.ts"
import * as frontend from "./agents/frontend-agent.ts"
import * as qa from "./agents/qa-agent.ts"
import {
  ensureDirectory,
  loadProjectEnvironment,
  projectPath,
  writeAgentResultLog,
  type AgentResult,
} from "./agents/shared.ts"

const oneMinuteMs = 60 * 1000
const logDirectory = projectPath("docs", "agent-logs")
const runOnce = process.argv.includes("--once")

type RoutineKey = "sabah" | "ogle" | "gece"

type RoutineState = Record<RoutineKey, number>

const lastRunDay: RoutineState = {
  sabah: -1,
  ogle: -1,
  gece: -1,
}

function log(message: string) {
  const line = `[${new Date().toISOString()}] [ORCHESTRATOR] ${message}`
  process.stdout.write(`${line}\n`)
  ensureDirectory(logDirectory)
  fs.appendFileSync(path.join(logDirectory, "orchestrator.log"), `${line}\n`)
}

async function guvenliCalistir(name: string, task: () => Promise<void | AgentResult>) {
  try {
    log(`> ${name}`)
    const result = await task()
    if (result) {
      writeAgentResultLog("orchestrator-results.jsonl", result)
      log(`${name}: ${result.summary}`)
    }
    log(`OK ${name}`)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Bilinmeyen hata"
    log(`FAIL ${name} - ${message}`)
  }
}

async function sabahRutini() {
  log("=== SABAH RUTINI BASLIYOR ===")
  await guvenliCalistir("QA -> Site Taramasi", () => qa.tamTarama())
  await guvenliCalistir("Backend -> API Sagligi", () => backend.apiSagligi())
  log("=== SABAH RUTINI TAMAMLANDI ===")
}

async function ogleRutini() {
  log("=== OGLE RUTINI BASLIYOR ===")
  await guvenliCalistir("Frontend -> UI Kontrol", () => frontend.uiKontrol())
  await guvenliCalistir("Backend -> Supabase Kontrol", () => backend.supabaseKontrol())
  log("=== OGLE RUTINI TAMAMLANDI ===")
}

async function geceRutini() {
  log("=== GECE RUTINI BASLIYOR ===")
  await guvenliCalistir("Frontend -> Eksik Sayfalar", () => frontend.eksikSayfalar())
  await guvenliCalistir("QA -> Kalite Kontrol", () => qa.kaliteKontrol())
  log("=== GECE RUTINI TAMAMLANDI ===")
}

function runScheduledRoutine(key: RoutineKey, day: number, routine: () => Promise<void>) {
  if (lastRunDay[key] === day) {
    return
  }

  lastRunDay[key] = day
  void routine()
}

function kontrol() {
  const now = new Date()
  const hour = now.getHours()
  const minute = now.getMinutes()
  const day = now.getDate()

  if (hour === 9 && minute === 0) {
    runScheduledRoutine("sabah", day, sabahRutini)
    return
  }

  if (hour === 14 && minute === 0) {
    runScheduledRoutine("ogle", day, ogleRutini)
    return
  }

  if (hour === 22 && minute === 0) {
    runScheduledRoutine("gece", day, geceRutini)
  }
}

async function main() {
  loadProjectEnvironment()

  log("Marketin24 Yazilim Takimi baslatildi")
  log(`Proje: ${process.env.PROJECT_DIR}`)
  log("Calisma saatleri: 09:00 sabah | 14:00 ogle | 22:00 gece")
  log("-------------------------------------------------")
  log("Ilk calistirma - hemen basliyor...")

  await sabahRutini()
  log("Ilk calistirma tamamlandi.")

  if (runOnce) {
    log("Tek seferlik calisma tamamlandi.")
    return
  }

  log("Zamanli gorevler bekleniyor...")
  setInterval(kontrol, oneMinuteMs)
}

void main().catch((error) => {
  const message = error instanceof Error ? error.message : "Bilinmeyen hata"
  log(`Orchestrator durdu - ${message}`)
  process.exitCode = 1
})
