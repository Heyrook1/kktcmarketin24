import { spawn } from "node:child_process"
import { appendFile, mkdir } from "node:fs/promises"
import path from "node:path"

const CLAUDE_TIMEOUT_MS = 600_000
const BACKEND_LOG_FILE_NAME = "backend.log"
const LOG_DIRECTORY_SEGMENTS = ["docs", "agent-logs"] as const

const API_HEALTH_PROMPT = `CLAUDE.md oku. Backend ajanısın. app/api/ klasörünü tara:
  1. Zod validation eksik route.ts dosyalarını bul ve ekle.
  2. Auth kontrolü eksik endpoint leri tespit et ve ekle.
  3. try/catch eksik route ları düzelt.
  4. Fiyat alanlarında min:1 validation var mı? Yoksa ekle.
  5. tsc --noEmit çalıştır. Raporu docs/agent-logs/backend-report.md yaz.`

const SUPABASE_CONTROL_PROMPT = `CLAUDE.md oku. Backend ajanısın. Supabase kullanımını kontrol et:
  1. Server component: createServerClient kullanılıyor mu?
  2. Client component: createBrowserClient kullanılıyor mu?
  3. N+1 sorgu riski var mı? Optimize et.
  4. Redis key convention: entity:id:action formatına uy.
  Raporu docs/agent-logs/supabase-report.md yaz.`

function resolveProjectDirectory(): string {
  const projectDirectory = process.env.PROJECT_DIR
  if (projectDirectory) {
    return projectDirectory
  }

  return process.cwd()
}

function formatErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  return String(error)
}

function sanitizePrompt(prompt: string): string {
  return prompt.replace(/"/g, "'").replace(/\n/g, " ").trim()
}

async function writeLog(projectDirectory: string, message: string): Promise<void> {
  const line = `[${new Date().toISOString()}] [BACKEND] ${message}`
  const logDirectory = path.join(projectDirectory, ...LOG_DIRECTORY_SEGMENTS)
  const logFilePath = path.join(logDirectory, BACKEND_LOG_FILE_NAME)

  process.stdout.write(`${line}\n`)
  await mkdir(logDirectory, { recursive: true })
  await appendFile(logFilePath, `${line}\n`, "utf8")
}

async function runClaudePrompt(projectDirectory: string, prompt: string): Promise<void> {
  const safePrompt = sanitizePrompt(prompt)

  await new Promise<void>((resolve, reject) => {
    const childProcess = spawn("claude", ["--dangerously-skip-permissions", safePrompt], {
      cwd: projectDirectory,
      shell: false,
      stdio: "inherit",
    })

    let isSettled = false
    const timeoutHandle = setTimeout(() => {
      if (isSettled) {
        return
      }

      isSettled = true
      childProcess.kill("SIGTERM")
      reject(new Error(`claude command timed out after ${CLAUDE_TIMEOUT_MS}ms`))
    }, CLAUDE_TIMEOUT_MS)

    childProcess.once("error", (error) => {
      if (isSettled) {
        return
      }

      isSettled = true
      clearTimeout(timeoutHandle)
      reject(error)
    })

    childProcess.once("close", (code, signal) => {
      if (isSettled) {
        return
      }

      isSettled = true
      clearTimeout(timeoutHandle)

      if (code === 0) {
        resolve()
        return
      }

      reject(new Error(`claude command failed with code=${code ?? "null"} signal=${signal ?? "null"}`))
    })
  })
}

export async function apiSagligi(): Promise<void> {
  const projectDirectory = resolveProjectDirectory()
  await writeLog(projectDirectory, "API sağlık taraması başlıyor...")

  try {
    await runClaudePrompt(projectDirectory, API_HEALTH_PROMPT)
    await writeLog(projectDirectory, "API sağlık taraması tamamlandı")
  } catch (error) {
    await writeLog(projectDirectory, `API sağlık taraması hata verdi: ${formatErrorMessage(error)}`)
    throw error
  }
}

export async function supabaseKontrol(): Promise<void> {
  const projectDirectory = resolveProjectDirectory()
  await writeLog(projectDirectory, "Supabase kontrolü başlıyor...")

  try {
    await runClaudePrompt(projectDirectory, SUPABASE_CONTROL_PROMPT)
    await writeLog(projectDirectory, "Supabase kontrolü tamamlandı")
  } catch (error) {
    await writeLog(projectDirectory, `Supabase kontrolü hata verdi: ${formatErrorMessage(error)}`)
    throw error
  }
}

export const backendAutomation = {
  apiSagligi,
  supabaseKontrol,
}

export default backendAutomation
