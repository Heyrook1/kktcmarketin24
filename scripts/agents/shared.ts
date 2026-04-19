import { spawn } from "node:child_process"
import { mkdirSync, appendFileSync, existsSync, readFileSync } from "node:fs"
import path from "node:path"

function getRootDirectory() {
  return process.env.PROJECT_DIR ?? process.cwd()
}

function getLogDirectory() {
  return path.join(getRootDirectory(), "docs", "agent-logs")
}

function ensureLogDirectory() {
  const logDirectory = getLogDirectory()
  if (!existsSync(logDirectory)) {
    mkdirSync(logDirectory, { recursive: true })
  }
}

function appendLog(fileName: string, message: string) {
  ensureLogDirectory()
  appendFileSync(path.join(getLogDirectory(), fileName), `${message}\n`)
}

function formatLogLine(scope: string, message: string) {
  return `[${new Date().toISOString()}] [${scope}] ${message}`
}

export async function runNodeScript(
  scriptRelativePath: string,
  scope: string,
): Promise<void> {
  const projectRoot = getRootDirectory()
  const resolvedScriptPath = path.join(projectRoot, scriptRelativePath)
  const logFileName = `${scope.toLowerCase().replace(/\s+/g, "-")}.log`

  const startLine = formatLogLine(scope, `START Running ${scriptRelativePath}`)
  process.stdout.write(`${startLine}\n`)
  appendLog(logFileName, startLine)

  await new Promise<void>((resolve, reject) => {
    const childProcess = spawn(process.execPath, [resolvedScriptPath], {
      cwd: projectRoot,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    })

    childProcess.stdout.on("data", (chunk: Buffer) => {
      const text = chunk.toString().trimEnd()
      if (!text) {
        return
      }
      text.split("\n").forEach((line) => {
        const outputLine = formatLogLine(scope, line)
        process.stdout.write(`${outputLine}\n`)
        appendLog(logFileName, outputLine)
      })
    })

    childProcess.stderr.on("data", (chunk: Buffer) => {
      const text = chunk.toString().trimEnd()
      if (!text) {
        return
      }
      text.split("\n").forEach((line) => {
        const outputLine = formatLogLine(scope, `stderr: ${line}`)
        process.stderr.write(`${outputLine}\n`)
        appendLog(logFileName, outputLine)
      })
    })

    childProcess.on("error", (error) => {
      reject(error)
    })

    childProcess.on("close", (exitCode) => {
      if (exitCode === 0) {
        const successLine = formatLogLine(scope, `SUCCESS Completed ${scriptRelativePath}`)
        process.stdout.write(`${successLine}\n`)
        appendLog(logFileName, successLine)
        resolve()
        return
      }

      reject(new Error(`${scriptRelativePath} exited with code ${exitCode ?? "unknown"}`))
    })
  })
}

export async function runCommand(
  command: string,
  args: string[],
  scope: string,
): Promise<void> {
  const projectRoot = getRootDirectory()
  const logFileName = `${scope.toLowerCase().replace(/\s+/g, "-")}.log`
  const commandLabel = `${command} ${args.join(" ")}`
  const startLine = formatLogLine(scope, `START Running ${commandLabel}`)
  process.stdout.write(`${startLine}\n`)
  appendLog(logFileName, startLine)

  await new Promise<void>((resolve, reject) => {
    const childProcess = spawn(command, args, {
      cwd: projectRoot,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    })

    childProcess.stdout.on("data", (chunk: Buffer) => {
      const text = chunk.toString().trimEnd()
      if (!text) {
        return
      }
      text.split("\n").forEach((line) => {
        const outputLine = formatLogLine(scope, line)
        process.stdout.write(`${outputLine}\n`)
        appendLog(logFileName, outputLine)
      })
    })

    childProcess.stderr.on("data", (chunk: Buffer) => {
      const text = chunk.toString().trimEnd()
      if (!text) {
        return
      }
      text.split("\n").forEach((line) => {
        const outputLine = formatLogLine(scope, `stderr: ${line}`)
        process.stderr.write(`${outputLine}\n`)
        appendLog(logFileName, outputLine)
      })
    })

    childProcess.on("error", (error) => {
      reject(error)
    })

    childProcess.on("close", (exitCode) => {
      if (exitCode === 0) {
        const successLine = formatLogLine(scope, `SUCCESS Completed ${commandLabel}`)
        process.stdout.write(`${successLine}\n`)
        appendLog(logFileName, successLine)
        resolve()
        return
      }

      reject(new Error(`${commandLabel} exited with code ${exitCode ?? "unknown"}`))
    })
  })
}

export function loadDotEnvLocal() {
  const projectRoot = getRootDirectory()
  const envPath = path.join(projectRoot, ".env.local")
  if (!existsSync(envPath)) {
    return
  }

  const envContent = readFileSync(envPath, "utf8")
  envContent.split("\n").forEach((line) => {
    const trimmedLine = line.trim()
    if (!trimmedLine || trimmedLine.startsWith("#")) {
      return
    }

    const equalSignIndex = trimmedLine.indexOf("=")
    if (equalSignIndex < 0) {
      return
    }

    const key = trimmedLine.slice(0, equalSignIndex).trim()
    const value = trimmedLine.slice(equalSignIndex + 1).trim()
    if (!key || process.env[key] !== undefined) {
      return
    }

    process.env[key] = value
  })
}

export function getProjectRoot() {
  return getRootDirectory()
}

export function writeScopeLog(scope: string, message: string) {
  const logFileName = `${scope.toLowerCase().replace(/\s+/g, "-")}.log`
  const line = formatLogLine(scope, message)
  process.stdout.write(`${line}\n`)
  appendLog(logFileName, line)
}
