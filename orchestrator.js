const { spawn } = require("node:child_process")
const { existsSync } = require("node:fs")
const { join } = require("node:path")

const projectDir = process.env.PROJECT_DIR || __dirname
const isWindows = process.platform === "win32"
const commandExtension = isWindows ? ".cmd" : ""

const configuredPackageManager = process.env.MARKETIN24_PACKAGE_MANAGER
const packageManager = configuredPackageManager || (existsSync(join(projectDir, "pnpm-lock.yaml")) ? "pnpm" : "npm")
const packageManagerCommand = `${packageManager}${commandExtension}`

const appProcess = spawn(packageManagerCommand, ["start"], {
  cwd: projectDir,
  env: process.env,
  stdio: "inherit",
  shell: false,
})

const stopApp = (signal) => {
  if (appProcess.killed) {
    process.exit(0)
    return
  }

  appProcess.once("exit", (code) => {
    process.exit(code ?? 0)
  })
  appProcess.kill(signal)
}

process.on("SIGINT", () => stopApp("SIGINT"))
process.on("SIGTERM", () => stopApp("SIGTERM"))

appProcess.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }

  process.exit(code ?? 0)
})

appProcess.on("error", (error) => {
  process.stderr.write(`Marketin24 baslatilamadi: ${error.message}\n`)
  process.exit(1)
})
