import { spawn } from "node:child_process"
import fs from "node:fs"
import { access, readdir, readFile } from "node:fs/promises"
import path from "node:path"

export type AgentResult = {
  summary: string
  details: string[]
}

export type AgentTaskResult = {
  name: string
  ok: boolean
  summary: string
}

export type CommandResult = {
  ok: boolean
  stdout: string
  stderr: string
}

export const projectRoot = process.env.PROJECT_DIR ?? path.join(import.meta.dirname, "..", "..")
process.env.PROJECT_DIR = projectRoot

function parseEnvironmentLine(line: string): [string, string] | null {
  const trimmedLine = line.trim()

  if (!trimmedLine || trimmedLine.startsWith("#")) {
    return null
  }

  const separatorIndex = trimmedLine.indexOf("=")
  if (separatorIndex === -1) {
    return null
  }

  const key = trimmedLine.slice(0, separatorIndex).trim()
  const rawValue = trimmedLine.slice(separatorIndex + 1).trim()
  const value = rawValue.replace(/^['"]|['"]$/g, "")

  return [key, value]
}

export function loadProjectEnvironment(): void {
  for (const fileName of [".env", ".env.local"]) {
    const filePath = path.join(projectRoot, fileName)

    if (!fs.existsSync(filePath)) {
      continue
    }

    const fileContents = fs.readFileSync(filePath, "utf8")
    for (const line of fileContents.split(/\r?\n/)) {
      const parsedLine = parseEnvironmentLine(line)

      if (!parsedLine) {
        continue
      }

      const [key, value] = parsedLine
      process.env[key] ??= value
    }
  }
}

export function getProjectPath(...segments: string[]): string {
  return path.join(projectRoot, ...segments)
}

export const projectPath = getProjectPath

export function ensureDirectory(directoryPath: string): void {
  fs.mkdirSync(directoryPath, { recursive: true })
}

export async function pathExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

export function createAgentLogger(agentName: string) {
  return (message: string): void => {
    const line = `[${new Date().toISOString()}] [${agentName}] ${message}`
    process.stdout.write(`${line}\n`)
  }
}

export async function assertPathExists(relativePath: string): Promise<void> {
  const absolutePath = getProjectPath(relativePath)

  if (await pathExists(absolutePath)) {
    return
  }

  throw new Error(`${relativePath} bulunamadi.`)
}

export async function assertFileContains(relativePath: string, tokens: string[]): Promise<void> {
  const fileContents = await readFile(getProjectPath(relativePath), "utf8")
  const missingTokens = tokens.filter((token) => !fileContents.includes(token))

  if (missingTokens.length === 0) {
    return
  }

  throw new Error(`${relativePath} icinde eksik marker: ${missingTokens.join(", ")}`)
}

export async function assertFileIncludes(relativePath: string, token: string): Promise<void> {
  const fileContents = await readFile(getProjectPath(relativePath), "utf8")

  if (fileContents.includes(token)) {
    return
  }

  throw new Error(`${relativePath} icinde ${token} bulunamadi.`)
}

export function assertRequiredEnvironment(variableNames: readonly string[]): void {
  const missingVariables = variableNames.filter((variableName) => !process.env[variableName])

  if (missingVariables.length === 0) {
    return
  }

  throw new Error(`Eksik ortam degiskenleri: ${missingVariables.join(", ")}`)
}

export async function listFiles(relativeDirectory: string, extension: string): Promise<string[]> {
  const directoryPath = getProjectPath(relativeDirectory)
  const entries = await readdir(directoryPath, { withFileTypes: true })
  const nestedFiles = await Promise.all(
    entries.map(async (entry) => {
      const relativeEntryPath = path.join(relativeDirectory, entry.name)

      if (entry.isDirectory()) {
        return listFiles(relativeEntryPath, extension)
      }

      if (entry.isFile() && entry.name.endsWith(extension)) {
        return [relativeEntryPath]
      }

      return []
    })
  )

  return nestedFiles.flat().sort()
}

export async function listRoutes(relativeDirectory = "app"): Promise<string[]> {
  const rootDirectory = getProjectPath(relativeDirectory)

  if (!(await pathExists(rootDirectory))) {
    return []
  }

  async function walk(directoryPath: string): Promise<string[]> {
    const entries = await readdir(directoryPath, { withFileTypes: true })
    const nestedRoutes = await Promise.all(
      entries.map(async (entry) => {
        const entryPath = path.join(directoryPath, entry.name)

        if (entry.isDirectory()) {
          return walk(entryPath)
        }

        if (entry.isFile() && (entry.name === "page.tsx" || entry.name === "route.ts")) {
          return [path.relative(projectRoot, entryPath)]
        }

        return []
      })
    )

    return nestedRoutes.flat()
  }

  return walk(rootDirectory)
}

export async function runCommand(
  command: string,
  args: string[],
  cwd: string
): Promise<CommandResult> {
  return new Promise((resolve) => {
    const childProcess = spawn(command, args, {
      cwd,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    })

    let stdout = ""
    let stderr = ""

    childProcess.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString()
    })

    childProcess.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString()
    })

    childProcess.on("error", (error) => {
      resolve({
        ok: false,
        stdout,
        stderr: error.message,
      })
    })

    childProcess.on("close", (code) => {
      resolve({
        ok: code === 0,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
      })
    })
  })
}

export function writeAgentResultLog(fileName: string, result: AgentResult): void {
  const logDirectory = getProjectPath("docs", "agent-logs")
  ensureDirectory(logDirectory)

  fs.appendFileSync(
    path.join(logDirectory, fileName),
    `${JSON.stringify({
      timestamp: new Date().toISOString(),
      ...result,
    })}\n`
  )
}
