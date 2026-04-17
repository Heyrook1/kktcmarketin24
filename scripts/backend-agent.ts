import { execFileSync } from "node:child_process"
import { appendFileSync, existsSync, mkdirSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const projectDirectory = process.env.PROJECT_DIR?.trim() || process.cwd()
const logDirectory = path.join(projectDirectory, "docs", "agent-logs")
const backendLogFilePath = path.join(logDirectory, "backend.log")

const apiHealthPrompt = `
CLAUDE.md oku. Backend ajanısın. app/api/ klasörünü tara:
1. Zod validation eksik route.ts dosyalarını bul ve ekle.
2. Auth kontrolü eksik endpoint leri tespit et ve ekle.
3. try/catch eksik route ları düzelt.
4. Fiyat alanlarında min:1 validation var mı? Yoksa ekle.
5. tsc --noEmit çalıştır. Raporu docs/agent-logs/backend-report.md yaz.
`.trim()

const supabaseControlPrompt = `
CLAUDE.md oku. Backend ajanısın. Supabase kullanımını kontrol et:
1. Server component: createServerClient kullanılıyor mu?
2. Client component: createBrowserClient kullanılıyor mu?
3. N+1 sorgu riski var mı? Optimize et.
4. Redis key convention: entity:id:action formatına uy.
Raporu docs/agent-logs/supabase-report.md yaz.
`.trim()

function ensureLogDirectory() {
  if (existsSync(logDirectory)) {
    return
  }

  mkdirSync(logDirectory, { recursive: true })
}

function writeLog(message: string) {
  const line = `[${new Date().toISOString()}] [BACKEND] ${message}`
  ensureLogDirectory()
  appendFileSync(backendLogFilePath, `${line}\n`)
  process.stdout.write(`${line}\n`)
}

function runClaudeTask(prompt: string) {
  const normalizedPrompt = prompt
    .replace(/\r?\n/g, " ")
    .replace(/\s+/g, " ")
    .trim()

  if (!normalizedPrompt) {
    throw new Error("Prompt boş olamaz.")
  }

  execFileSync("claude", ["--dangerously-skip-permissions", normalizedPrompt], {
    cwd: projectDirectory,
    stdio: "inherit",
    timeout: 600_000,
  })
}

export async function apiSagligi() {
  writeLog("API sağlık taraması başlıyor...")
  runClaudeTask(apiHealthPrompt)
  writeLog("API sağlık taraması tamamlandı")
}

export async function supabaseKontrol() {
  writeLog("Supabase kontrolü başlıyor...")
  runClaudeTask(supabaseControlPrompt)
  writeLog("Supabase kontrolü tamamlandı")
}

type BackendTaskName = "api-sagligi" | "supabase-kontrol"

async function runCliTask(taskName: BackendTaskName) {
  if (taskName === "api-sagligi") {
    await apiSagligi()
    return
  }

  await supabaseKontrol()
}

function getTaskNameFromArguments(argumentValue: string | undefined): BackendTaskName {
  if (argumentValue === "api-sagligi" || argumentValue === "supabase-kontrol") {
    return argumentValue
  }

  throw new Error('Geçersiz görev. Kullanım: "api-sagligi" veya "supabase-kontrol".')
}

export const backendAutomationTasks = {
  apiSagligi,
  supabaseKontrol,
}

const currentFilePath = fileURLToPath(import.meta.url)
const invokedFilePath = process.argv[1] ? path.resolve(process.argv[1]) : ""

if (currentFilePath === invokedFilePath) {
  const taskName = getTaskNameFromArguments(process.argv[2])
  runCliTask(taskName).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error)
    process.stderr.write(`[BACKEND] Görev başarısız: ${message}\n`)
    process.exit(1)
  })
}
