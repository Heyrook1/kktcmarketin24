import { spawn } from "node:child_process"
import { existsSync } from "node:fs"
import path from "node:path"

export type CommandStep = {
  command: string
  args: string[]
  label: string
}

type RunOptions = {
  projectDir: string
  log: (message: string) => void
}

function selectPackageManager(projectDir: string): "pnpm" | "npm" {
  const pnpmLockPath = path.join(projectDir, "pnpm-lock.yaml")
  if (existsSync(pnpmLockPath)) {
    return "pnpm"
  }

  return "npm"
}

function runProcess(
  command: string,
  args: string[],
  options: RunOptions,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const processInstance = spawn(command, args, {
      cwd: options.projectDir,
      env: process.env,
      stdio: "inherit",
    })

    processInstance.on("error", (error) => {
      reject(error)
    })

    processInstance.on("exit", (code) => {
      if (code === 0) {
        resolve()
        return
      }

      reject(new Error(`${command} exited with code ${String(code)}`))
    })
  })
}

export async function runSteps(
  steps: CommandStep[],
  options: RunOptions,
): Promise<void> {
  const packageManager = selectPackageManager(options.projectDir)

  for (const step of steps) {
    options.log(`Running step: ${step.label}`)
    const command = step.command === "$PM" ? packageManager : step.command
    await runProcess(command, step.args, options)
  }
}
