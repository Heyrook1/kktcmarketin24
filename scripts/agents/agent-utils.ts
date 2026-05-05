import { access, appendFile, mkdir, readdir, readFile, stat } from "node:fs/promises"
import path from "node:path"

const ignoredDirectoryNames = new Set([".git", ".next", "node_modules"])

export function projectPath(projectDirectory?: string, ...segments: string[]): string {
  return path.join(projectDirectory ?? process.cwd(), ...segments)
}

export async function pathExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

export async function readProjectFile(
  projectDirectory: string | undefined,
  relativePath: string,
): Promise<string> {
  return readFile(projectPath(projectDirectory, relativePath), "utf8")
}

export async function requireProjectFiles(
  projectDirectory: string | undefined,
  relativePaths: string[],
): Promise<void> {
  const missingPaths: string[] = []

  for (const relativePath of relativePaths) {
    if (!(await pathExists(projectPath(projectDirectory, relativePath)))) {
      missingPaths.push(relativePath)
    }
  }

  if (missingPaths.length === 0) {
    return
  }

  throw new Error(`Eksik dosyalar: ${missingPaths.join(", ")}`)
}

export async function requireFileIncludes(
  projectDirectory: string | undefined,
  relativePath: string,
  token: string,
  failureMessage: string,
): Promise<void> {
  const source = await readProjectFile(projectDirectory, relativePath)

  if (source.includes(token)) {
    return
  }

  throw new Error(failureMessage)
}

export async function appendAgentLog(
  projectDirectory: string | undefined,
  fileName: string,
  message: string,
): Promise<void> {
  const logDirectory = projectPath(projectDirectory, "docs", "agent-logs")
  const line = `[${new Date().toISOString()}] ${message}\n`

  await mkdir(logDirectory, { recursive: true })
  await appendFile(projectPath(logDirectory, fileName), line)
}

export async function listFilesByExtension(
  directoryPath: string,
  extensions: string[],
): Promise<string[]> {
  if (!(await pathExists(directoryPath))) {
    return []
  }

  const entries = await readdir(directoryPath, { withFileTypes: true })
  const files: string[] = []

  for (const entry of entries) {
    const entryPath = path.join(directoryPath, entry.name)

    if (entry.isDirectory()) {
      if (!ignoredDirectoryNames.has(entry.name)) {
        files.push(...(await listFilesByExtension(entryPath, extensions)))
      }
      continue
    }

    if (entry.isFile() && extensions.includes(path.extname(entry.name))) {
      files.push(entryPath)
    }
  }

  return files
}

export async function assertNonEmptyFile(
  projectDirectory: string | undefined,
  relativePath: string,
): Promise<void> {
  const fileStat = await stat(projectPath(projectDirectory, relativePath))

  if (fileStat.size > 0) {
    return
  }

  throw new Error(`${relativePath} dosyasi bos.`)
}
