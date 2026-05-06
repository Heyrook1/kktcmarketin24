import { spawn } from "node:child_process"
import { constants, existsSync } from "node:fs"
import { access } from "node:fs/promises"
import path from "node:path"

export type PackageManager = "pnpm" | "npm"

export type AgentContext = {
  projectDir: string
  packageManager: PackageManager
  env: NodeJS.ProcessEnv
  log: (message: string) => void | Promise<void>
}

type RunCommandOptions = {
  timeoutMs?: number
}

type FetchWithTimeoutOptions = RequestInit & {
  timeoutMs?: number
}

const DEFAULT_COMMAND_TIMEOUT_MS = 120_000
const DEFAULT_FETCH_TIMEOUT_MS = 10_000

export function toErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return String(error)
}

export function detectPackageManager(projectDir: string): PackageManager {
  if (!existsSync(path.join(projectDir, "pnpm-lock.yaml"))) return "npm"
  return process.env.npm_execpath?.includes("pnpm") ? "pnpm" : "npm"
}

export async function assertFilesExist(context: AgentContext, relativePaths: string[]): Promise<void> {
  const missingFiles: string[] = []

  for (const relativePath of relativePaths) {
    const absolutePath = path.join(context.projectDir, relativePath)

    try {
      await access(absolutePath, constants.F_OK)
    } catch {
      missingFiles.push(relativePath)
    }
  }

  if (missingFiles.length > 0) {
    throw new Error(`Eksik dosyalar: ${missingFiles.join(", ")}`)
  }

  await context.log(`${relativePaths.length} dosya doğrulandı.`)
}

export async function runPackageScript(
  context: AgentContext,
  scriptName: string,
  options: RunCommandOptions = {},
): Promise<void> {
  const args = context.packageManager === "pnpm" ? [scriptName] : ["run", scriptName]
  await runCommand(context, context.packageManager, args, options)
}

export async function runCommand(
  context: AgentContext,
  command: string,
  args: string[],
  options: RunCommandOptions = {},
): Promise<void> {
  await context.log(`Komut çalışıyor: ${command} ${args.join(" ")}`)

  const timeoutMs = options.timeoutMs ?? DEFAULT_COMMAND_TIMEOUT_MS

  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: context.projectDir,
      env: context.env,
      stdio: ["ignore", "pipe", "pipe"],
    })

    let output = ""
    const appendOutput = (chunk: Buffer) => {
      output += chunk.toString("utf8")
      if (output.length > 8_000) output = output.slice(-8_000)
    }

    child.stdout.on("data", appendOutput)
    child.stderr.on("data", appendOutput)

    const timeout = setTimeout(() => {
      child.kill("SIGTERM")
      reject(new Error(`Komut zaman aşımına uğradı: ${command} ${args.join(" ")}`))
    }, timeoutMs)

    child.on("error", (error) => {
      clearTimeout(timeout)
      reject(error)
    })

    child.on("close", (code) => {
      clearTimeout(timeout)

      if (code === 0) {
        resolve()
        return
      }

      const details = output.trim() ? `\n${output.trim()}` : ""
      reject(new Error(`Komut başarısız oldu (${code}): ${command} ${args.join(" ")}${details}`))
    })
  })
}

export async function fetchWithTimeout(
  input: string,
  options: FetchWithTimeoutOptions = {},
): Promise<Response> {
  const abortController = new AbortController()
  const timeout = setTimeout(() => abortController.abort(), options.timeoutMs ?? DEFAULT_FETCH_TIMEOUT_MS)

  try {
    return await fetch(input, {
      ...options,
      signal: abortController.signal,
    })
  } finally {
    clearTimeout(timeout)
  }
}
