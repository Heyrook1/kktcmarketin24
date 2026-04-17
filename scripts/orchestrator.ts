#!/usr/bin/env node

import { appendFileSync, existsSync, mkdirSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

type AgentContext = {
  projectDir: string
  log: (message: string) => void
}

type AgentModule = {
  tamTarama?: (context: AgentContext) => Promise<void>
  kaliteKontrol?: (context: AgentContext) => Promise<void>
  apiSagligi?: (context: AgentContext) => Promise<void>
  supabaseKontrol?: (context: AgentContext) => Promise<void>
  uiKontrol?: (context: AgentContext) => Promise<void>
  eksikSayfalar?: (context: AgentContext) => Promise<void>
}

const currentFilePath = fileURLToPath(import.meta.url)
const currentDirectory = path.dirname(currentFilePath)
const projectDir = process.env.PROJECT_DIR ?? path.join(currentDirectory, "..")
process.env.PROJECT_DIR = projectDir

const logDirectory = path.join(projectDir, "docs", "agent-logs")
const orchestratorLogPath = path.join(logDirectory, "orchestrator.log")

function ensureLogDirectoryExists(): void {
  if (existsSync(logDirectory)) {
    return
  }

  mkdirSync(logDirectory, { recursive: true })
}

function writeOutput(message: string): void {
  process.stdout.write(`${message}\n`)
}

function log(message: string): void {
  const line = `[${new Date().toISOString()}] [ORCHESTRATOR] ${message}`
  writeOutput(line)
  ensureLogDirectoryExists()
  appendFileSync(orchestratorLogPath, `${line}\n`)
}

const agentContext: AgentContext = {
  projectDir,
  log,
}

let loadedAgentsPromise:
  | Promise<{
      backend: AgentModule
      frontend: AgentModule
      qa: AgentModule
    }>
  | null = null

async function loadAgents(): Promise<{
  backend: AgentModule
  frontend: AgentModule
  qa: AgentModule
}> {
  if (loadedAgentsPromise) {
    return loadedAgentsPromise
  }

  loadedAgentsPromise = Promise.all([
    import(new URL("./agents/backend-agent.ts", import.meta.url).href),
    import(new URL("./agents/frontend-agent.ts", import.meta.url).href),
    import(new URL("./agents/qa-agent.ts", import.meta.url).href),
  ]).then(([backendModule, frontendModule, qaModule]) => ({
    backend: backendModule.default as AgentModule,
    frontend: frontendModule.default as AgentModule,
    qa: qaModule.default as AgentModule,
  }))

  return loadedAgentsPromise
}

async function guvenliCalistir(
  gorevIsmi: string,
  gorev: (context: AgentContext) => Promise<void>,
): Promise<void> {
  try {
    log(`START ${gorevIsmi}`)
    await gorev(agentContext)
    log(`DONE ${gorevIsmi}`)
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error"
    log(`FAIL ${gorevIsmi} -- ${errorMessage}`)
  }
}

async function sabahRutini(): Promise<void> {
  const { backend, qa } = await loadAgents()
  log("=== MORNING ROUTINE STARTED ===")
  if (qa.tamTarama) {
    await guvenliCalistir("QA -> Site taramasi", qa.tamTarama)
  }
  if (backend.apiSagligi) {
    await guvenliCalistir("Backend -> API sagligi", backend.apiSagligi)
  }
  log("=== MORNING ROUTINE FINISHED ===")
}

async function ogleRutini(): Promise<void> {
  const { backend, frontend } = await loadAgents()
  log("=== MIDDAY ROUTINE STARTED ===")
  if (frontend.uiKontrol) {
    await guvenliCalistir("Frontend -> UI kontrol", frontend.uiKontrol)
  }
  if (backend.supabaseKontrol) {
    await guvenliCalistir("Backend -> Supabase kontrol", backend.supabaseKontrol)
  }
  log("=== MIDDAY ROUTINE FINISHED ===")
}

async function geceRutini(): Promise<void> {
  const { frontend, qa } = await loadAgents()
  log("=== NIGHT ROUTINE STARTED ===")
  if (frontend.eksikSayfalar) {
    await guvenliCalistir("Frontend -> Eksik sayfalar", frontend.eksikSayfalar)
  }
  if (qa.kaliteKontrol) {
    await guvenliCalistir("QA -> Kalite kontrol", qa.kaliteKontrol)
  }
  log("=== NIGHT ROUTINE FINISHED ===")
}

let lastMorningDay = -1
let lastMiddayDay = -1
let lastNightDay = -1

function kontrol(): void {
  const now = new Date()
  const currentHour = now.getHours()
  const currentMinute = now.getMinutes()
  const currentDay = now.getDate()

  if (currentHour === 9 && currentMinute === 0 && lastMorningDay !== currentDay) {
    lastMorningDay = currentDay
    void sabahRutini()
  }

  if (currentHour === 14 && currentMinute === 0 && lastMiddayDay !== currentDay) {
    lastMiddayDay = currentDay
    void ogleRutini()
  }

  if (currentHour === 22 && currentMinute === 0 && lastNightDay !== currentDay) {
    lastNightDay = currentDay
    void geceRutini()
  }
}

log("Marketin24 software team orchestrator started")
log(`Project directory: ${projectDir}`)
log("Working hours: 09:00 morning | 14:00 midday | 22:00 night")
log("-------------------------------------------------------------")
log("Initial run: starting immediately")

void sabahRutini().then(() => {
  log("Initial run completed. Waiting for scheduled tasks.")
})

setInterval(kontrol, 60 * 1000)
