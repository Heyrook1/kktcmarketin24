const fs: typeof import("node:fs") = require("node:fs")
const path: typeof import("node:path") = require("node:path")

type Check = {
  label: string
  ok: boolean
  detail: string
}

function projectPath(...parts: string[]): string {
  return path.join(process.env.PROJECT_DIR ?? path.join(__dirname, "..", ".."), ...parts)
}

function fileExists(relativePath: string): boolean {
  return fs.existsSync(projectPath(relativePath))
}

function fileIncludes(relativePath: string, token: string): boolean {
  const fullPath = projectPath(relativePath)

  if (!fs.existsSync(fullPath)) {
    return false
  }

  return fs.readFileSync(fullPath, "utf8").includes(token)
}

function hasEnvironmentValue(name: string): boolean {
  return Boolean(process.env[name]?.trim())
}

function assertChecks(agentName: string, checks: Check[]): void {
  const logDir = projectPath("docs", "agent-logs")
  fs.mkdirSync(logDir, { recursive: true })

  const lines = [
    `[${new Date().toISOString()}] [${agentName}]`,
    ...checks.map((check) => `${check.ok ? "OK" : "FAIL"} ${check.label}: ${check.detail}`),
    "",
  ]

  fs.appendFileSync(path.join(logDir, `${agentName}.log`), `${lines.join("\n")}\n`)

  const failedChecks = checks.filter((check) => !check.ok)
  if (failedChecks.length === 0) {
    return
  }

  throw new Error(failedChecks.map((check) => check.label).join(", "))
}

module.exports = {
  assertChecks,
  fileExists,
  fileIncludes,
  hasEnvironmentValue,
}
