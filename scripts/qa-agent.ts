import fs from "node:fs"
import path from "node:path"
import { spawn } from "node:child_process"

const projectDirectory = process.env.PROJECT_DIR ?? process.cwd()
const agentLogsDirectory = path.join(projectDirectory, "docs", "agent-logs")
const qaLogPath = path.join(agentLogsDirectory, "qa.log")
const commandTimeoutInMilliseconds = 600_000

function ensureAgentLogsDirectory(): void {
  if (fs.existsSync(agentLogsDirectory)) {
    return
  }

  fs.mkdirSync(agentLogsDirectory, { recursive: true })
}

function appendQaLog(message: string): void {
  const logLine = `[${new Date().toISOString()}] [QA] ${message}`
  ensureAgentLogsDirectory()
  process.stdout.write(`${logLine}\n`)
  fs.appendFileSync(qaLogPath, `${logLine}\n`, "utf8")
}

function normalizePrompt(rawPrompt: string): string {
  return rawPrompt.replace(/\s+/g, " ").trim()
}

async function runClaudePrompt(prompt: string): Promise<void> {
  const normalizedPrompt = normalizePrompt(prompt)

  await new Promise<void>((resolve, reject) => {
    const childProcess = spawn(
      "claude",
      ["--dangerously-skip-permissions", normalizedPrompt],
      {
        cwd: projectDirectory,
        stdio: "inherit",
      }
    )

    const timeoutHandle = setTimeout(() => {
      childProcess.kill("SIGTERM")
      reject(
        new Error(
          `Claude command timed out after ${commandTimeoutInMilliseconds}ms`
        )
      )
    }, commandTimeoutInMilliseconds)

    childProcess.on("error", (error) => {
      clearTimeout(timeoutHandle)
      reject(error)
    })

    childProcess.on("exit", (code, signal) => {
      clearTimeout(timeoutHandle)

      if (code === 0) {
        resolve()
        return
      }

      reject(
        new Error(
          `Claude command failed with code=${code ?? "null"} signal=${signal ?? "null"}`
        )
      )
    })
  })
}

export async function tamTarama(): Promise<void> {
  appendQaLog("Tam site taraması başlıyor...")

  await runClaudePrompt(`CLAUDE.md oku. QA ajanısın.
    1. app/ altındaki tüm sayfaları tara - broken link var mı?
    2. /privacy /terms /help sayfaları mevcut mu? Yoksa oluştur.
    3. Ana sayfada stok=0 ürün var mı? Filtrele.
    4. Demo ürünler görünüyor mu? Gizle.
    5. /compare sayfasında olmayan özellik işaretli mi? Kaldır.
    6. Footer telefon: +90 533 873 43 17 tutarlı mı? Düzelt.
    7. Bulguları docs/agent-logs/qa-report.md yaz. GitHub Issue aç, label: bug`)

  appendQaLog("Tam site taraması tamamlandı")
}

export async function kaliteKontrol(): Promise<void> {
  appendQaLog("Kalite kontrolü başlıyor...")

  await runClaudePrompt(`CLAUDE.md oku. tsc --noEmit && eslint . && npm run test:qa çalıştır.
    Hata varsa düzelt ve temiz geçene kadar tekrar çalıştır.
    Sonucu docs/agent-logs/quality-report.md yaz.`)

  appendQaLog("Kalite kontrolü tamamlandı")
}

export const qaAjanGorevleri = {
  tamTarama,
  kaliteKontrol,
}
