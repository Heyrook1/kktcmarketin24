import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import * as backend from "./agents/backend-agent.ts"
import * as frontend from "./agents/frontend-agent.ts"
import * as qa from "./agents/qa-agent.ts"

type RoutineName = "sabah" | "ogle" | "gece"

type ScheduledRoutine = {
  name: RoutineName
  displayName: string
  hour: number
  minute: number
  run: () => Promise<void>
}

const currentFilePath = fileURLToPath(import.meta.url)
const scriptsDirectory = path.dirname(currentFilePath)
const defaultProjectDirectory = path.resolve(scriptsDirectory, "..")
const projectDirectory = process.env.PROJECT_DIR || defaultProjectDirectory
const logDirectory = path.join(projectDirectory, "docs", "agent-logs")
const oneShotRoutine = parseOneShotRoutine(process.env.ORCHESTRATOR_RUN_ONCE)

const lastRunDays: Record<RoutineName, number> = {
  sabah: -1,
  ogle: -1,
  gece: -1,
}

function parseOneShotRoutine(value: string | undefined): RoutineName | "all" | undefined {
  if (!value || value === "false" || value === "0") {
    return undefined
  }

  if (value === "sabah" || value === "ogle" || value === "gece" || value === "all") {
    return value
  }

  throw new Error(`Bilinmeyen tek seferlik rutin: ${value}`)
}

function loadProjectEnv() {
  const loadedValues: Record<string, string> = {}

  for (const fileName of [".env", ".env.local"]) {
    const envFilePath = path.join(projectDirectory, fileName)

    if (!fs.existsSync(envFilePath)) {
      continue
    }

    const envFile = fs.readFileSync(envFilePath, "utf8")

    for (const rawLine of envFile.split(/\r?\n/)) {
      const line = rawLine.trim()

      if (!line || line.startsWith("#")) {
        continue
      }

      const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/)

      if (!match) {
        continue
      }

      const [, key, rawValue] = match
      const value = rawValue.replace(/^(['"])(.*)\1$/, "$2")

      loadedValues[key] = value
    }
  }

  for (const [key, value] of Object.entries(loadedValues)) {
    if (process.env[key] === undefined) {
      process.env[key] = value
    }
  }
}

function log(message: string) {
  const line = `[${new Date().toISOString()}] [ORCHESTRATOR] ${message}`

  process.stdout.write(`${line}\n`)
  fs.mkdirSync(logDirectory, { recursive: true })
  fs.appendFileSync(path.join(logDirectory, "orchestrator.log"), `${line}\n`)
}

async function guvenliCalistir(isim: string, fn: () => Promise<void>) {
  try {
    log(`> ${isim}`)
    await fn()
    log(`OK ${isim}`)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Bilinmeyen hata"
    log(`HATA ${isim} - ${message}`)
  }
}

async function sabahRutini() {
  log("=== SABAH RUTINI BASLIYOR ===")
  await guvenliCalistir("QA -> Site Taramasi", () => qa.tamTarama(projectDirectory))
  await guvenliCalistir("Backend -> API Sagligi", () => backend.apiSagligi(projectDirectory))
  log("=== SABAH RUTINI TAMAMLANDI ===")
}

async function ogleRutini() {
  log("=== OGLE RUTINI BASLIYOR ===")
  await guvenliCalistir("Frontend -> UI Kontrol", () => frontend.uiKontrol(projectDirectory))
  await guvenliCalistir("Backend -> Supabase Kontrol", () => backend.supabaseKontrol(projectDirectory))
  log("=== OGLE RUTINI TAMAMLANDI ===")
}

async function geceRutini() {
  log("=== GECE RUTINI BASLIYOR ===")
  await guvenliCalistir("Frontend -> Eksik Sayfalar", () => frontend.eksikSayfalar(projectDirectory))
  await guvenliCalistir("QA -> Kalite Kontrol", () => qa.kaliteKontrol(projectDirectory))
  log("=== GECE RUTINI TAMAMLANDI ===")
}

const routines: ScheduledRoutine[] = [
  {
    name: "sabah",
    displayName: "09:00 sabah",
    hour: 9,
    minute: 0,
    run: sabahRutini,
  },
  {
    name: "ogle",
    displayName: "14:00 ogle",
    hour: 14,
    minute: 0,
    run: ogleRutini,
  },
  {
    name: "gece",
    displayName: "22:00 gece",
    hour: 22,
    minute: 0,
    run: geceRutini,
  },
]

function kontrol() {
  const now = new Date()
  const currentHour = now.getHours()
  const currentMinute = now.getMinutes()
  const currentDay = now.getDate()

  for (const routine of routines) {
    if (
      currentHour === routine.hour &&
      currentMinute === routine.minute &&
      lastRunDays[routine.name] !== currentDay
    ) {
      lastRunDays[routine.name] = currentDay
      void routine.run()
    }
  }
}

async function runOnce() {
  if (!oneShotRoutine) {
    await sabahRutini()
    return
  }

  if (oneShotRoutine === "all") {
    for (const routine of routines) {
      await routine.run()
    }
    return
  }

  const routine = routines.find((scheduledRoutine) => scheduledRoutine.name === oneShotRoutine)

  if (!routine) {
    throw new Error(`Bilinmeyen rutin: ${oneShotRoutine}`)
  }

  await routine.run()
}

loadProjectEnv()

log("Marketin24 Yazilim Takimi baslatildi")
log(`Proje: ${projectDirectory}`)
log(`Calisma saatleri: ${routines.map((routine) => routine.displayName).join(" | ")}`)
log("-------------------------------------------------")

if (oneShotRoutine) {
  log(`Tek seferlik calisma basliyor: ${oneShotRoutine}`)
  await runOnce()
  log("Tek seferlik calisma tamamlandi.")
} else {
  log("Ilk calistirma - hemen basliyor...")
  await runOnce()
  log("Ilk calistirma tamamlandi. Zamanli gorevler bekleniyor...")
  setInterval(kontrol, 60 * 1000)
}
