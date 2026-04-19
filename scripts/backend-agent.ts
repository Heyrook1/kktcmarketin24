import { execFileSync } from "node:child_process"
import { appendFileSync, existsSync, mkdirSync } from "node:fs"
import path from "node:path"

const projectDirectory = process.env.PROJECT_DIR ?? process.cwd()
const logDirectory = path.join(projectDirectory, "docs", "agent-logs")

function ensureLogDirectory(): void {
  if (!existsSync(logDirectory)) {
    mkdirSync(logDirectory, { recursive: true })
  }
}

function log(message: string): void {
  const line = `[${new Date().toISOString()}] [BACKEND] ${message}`
  process.stdout.write(`${line}\n`)
  ensureLogDirectory()
  appendFileSync(path.join(logDirectory, "backend.log"), `${line}\n`)
}

function run(prompt: string): void {
  const sanitizedPrompt = prompt.replaceAll("\n", " ").trim()

  execFileSync("claude", ["--dangerously-skip-permissions", sanitizedPrompt], {
    cwd: projectDirectory,
    stdio: "inherit",
    timeout: 600_000,
  })
}

export function apiSagligi(): void {
  log("API sağlık taraması başlıyor...")
  run(`CLAUDE.md oku. Backend ajanısın. app/api/ klasörünü tara:
    1. Zod validation eksik route.ts dosyalarını bul ve ekle.
    2. Auth kontrolü eksik endpoint leri tespit et ve ekle.
    3. try/catch eksik route ları düzelt.
    4. Fiyat alanlarında min:1 validation var mı? Yoksa ekle.
    5. tsc --noEmit çalıştır. Raporu docs/agent-logs/backend-report.md yaz.`)
  log("API sağlık taraması tamamlandı")
}

export function supabaseKontrol(): void {
  log("Supabase kontrolü başlıyor...")
  run(`CLAUDE.md oku. Backend ajanısın. Supabase kullanımını kontrol et:
    1. Server component: createServerClient kullanılıyor mu?
    2. Client component: createBrowserClient kullanılıyor mu?
    3. N+1 sorgu riski var mı? Optimize et.
    4. Redis key convention: entity:id:action formatına uy.
    Raporu docs/agent-logs/supabase-report.md yaz.`)
  log("Supabase kontrolü tamamlandı")
}

export const backendAgentTasks = {
  apiSagligi,
  supabaseKontrol,
}
