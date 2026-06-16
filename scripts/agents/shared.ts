import { execFile } from "node:child_process"
import { access, appendFile, mkdir, readdir, readFile, stat } from "node:fs/promises"
import path from "node:path"
import { promisify } from "node:util"

const execFileAsync = promisify(execFile)

export type AgentLogger = (message: string) => Promise<void>

export interface AgentContext {
  log: AgentLogger
  logDir: string
  projectDir: string
}

export interface CommandResult {
  command: string
  output: string
}

export interface FileInventory {
  apiRoutes: string[]
  components: string[]
  pages: string[]
}

export function createAgentLog(context: AgentContext, agentName: string): AgentLogger {
  return async (message) => {
    const line = `[${new Date().toISOString()}] [${agentName}] ${message}`
    await context.log(line)
    await appendFile(path.join(context.logDir, `${agentName.toLowerCase()}.log`), `${line}\n`, "utf8")
  }
}

export async function ensureLogDir(logDir: string): Promise<void> {
  await mkdir(logDir, { recursive: true })
}

export async function pathExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

export async function readProjectFile(projectDir: string, relativePath: string): Promise<string> {
  return readFile(path.join(projectDir, relativePath), "utf8")
}

export async function runPnpmScript(projectDir: string, scriptName: string): Promise<CommandResult> {
  const pnpmPath = process.env.PNPM_PATH ?? "pnpm"
  const { stdout, stderr } = await execFileAsync(pnpmPath, ["run", scriptName], {
    cwd: projectDir,
    env: process.env,
    maxBuffer: 1024 * 1024 * 10,
  })

  return {
    command: `${pnpmPath} run ${scriptName}`,
    output: `${stdout}${stderr}`.trim(),
  }
}

export async function listFiles(projectDir: string, relativeDir: string, extensions: readonly string[]): Promise<string[]> {
  const rootDir = path.join(projectDir, relativeDir)
  if (!(await pathExists(rootDir))) {
    return []
  }

  const results: string[] = []
  await collectFiles(rootDir, projectDir, extensions, results)
  return results.sort()
}

export async function getFileInventory(projectDir: string): Promise<FileInventory> {
  const [apiRoutes, components, pages] = await Promise.all([
    listFiles(projectDir, "app/api", [".ts"]),
    listFiles(projectDir, "components", [".tsx"]),
    listFiles(projectDir, "app", [".tsx"]),
  ])

  return {
    apiRoutes: apiRoutes.filter((filePath) => filePath.endsWith("/route.ts")),
    components,
    pages: pages.filter((filePath) => filePath.endsWith("/page.tsx")),
  }
}

async function collectFiles(
  currentDir: string,
  baseDir: string,
  extensions: readonly string[],
  results: string[],
): Promise<void> {
  const entries = await readdir(currentDir, { withFileTypes: true })

  await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(currentDir, entry.name)
      if (entry.isDirectory()) {
        await collectFiles(fullPath, baseDir, extensions, results)
        return
      }

      if (!entry.isFile() || !extensions.includes(path.extname(entry.name))) {
        return
      }

      const fileStats = await stat(fullPath)
      if (fileStats.size === 0) {
        throw new Error(`${path.relative(baseDir, fullPath)} is empty`)
      }

      results.push(path.relative(baseDir, fullPath).split(path.sep).join("/"))
    }),
  )
}
