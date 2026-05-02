import { appendFile, mkdir, readdir, readFile } from "node:fs/promises"
import path from "node:path"
import { pathToFileURL } from "node:url"

import {
  createAgentLogger,
  getProjectPath,
  pathExists,
  projectRoot,
  runCommand,
  type AgentTaskResult,
} from "./shared.ts"

const log = createAgentLogger("QA")

async function collectRouteFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name)

      if (entry.isDirectory()) {
        return collectRouteFiles(entryPath)
      }

      if (entry.name === "page.tsx" || entry.name === "route.ts") {
        return [entryPath]
      }

      return []
    })
  )

  return files.flat()
}

async function writeReport(reportName: string, lines: string[]): Promise<void> {
  const reportDir = getProjectPath("docs", "agent-logs")

  await mkdir(reportDir, { recursive: true })
  await appendFile(
    path.join(reportDir, reportName),
    [`# ${new Date().toISOString()}`, ...lines, ""].join("\n")
  )
}

async function validateSmokeScript(projectDir: string): Promise<AgentTaskResult> {
  const smokeScriptPath = path.join(projectDir, "scripts", "qa-smoke.mjs")

  if (!(await pathExists(smokeScriptPath))) {
    return {
      name: "QA smoke",
      ok: false,
      summary: "scripts/qa-smoke.mjs bulunamadi.",
    }
  }

  const nodeBinary = process.execPath
  const result = await runCommand(nodeBinary, [smokeScriptPath], projectDir)

  return {
    name: "QA smoke",
    ok: result.ok,
    summary: result.ok ? "QA smoke kontrolleri gecti." : result.stderr || result.stdout,
  }
}

async function inspectCorePages(projectDir: string): Promise<AgentTaskResult> {
  const requiredPages = [
    "app/page.tsx",
    "app/products/page.tsx",
    "app/cart/page.tsx",
    "app/checkout/page.tsx",
    "app/contact/page.tsx",
  ]

  const missingPages = (
    await Promise.all(
      requiredPages.map(async (relativePath) => ({
        exists: await pathExists(path.join(projectDir, relativePath)),
        relativePath,
      }))
    )
  )
    .filter((page) => !page.exists)
    .map((page) => page.relativePath)

  return {
    name: "Temel sayfalar",
    ok: missingPages.length === 0,
    summary:
      missingPages.length === 0
        ? `${requiredPages.length} temel sayfa mevcut.`
        : `Eksik temel sayfalar: ${missingPages.join(", ")}`,
  }
}

async function inspectRouteHandlers(projectDir: string): Promise<AgentTaskResult> {
  const routeFiles = await collectRouteFiles(path.join(projectDir, "app"))
  const apiRoutes = routeFiles.filter((routeFile) => routeFile.includes(`${path.sep}api${path.sep}`))

  return {
    name: "Route envanteri",
    ok: routeFiles.length > 0 && apiRoutes.length > 0,
    summary: `${routeFiles.length} route dosyasi ve ${apiRoutes.length} API route dosyasi bulundu.`,
  }
}

export async function tamTarama(): Promise<void> {
  const projectDir = projectRoot

  log("Tam tarama basliyor.")
  const results = await Promise.all([
    inspectCorePages(projectDir),
    inspectRouteHandlers(projectDir),
    validateSmokeScript(projectDir),
  ])

  await writeReport(
    "qa-report.md",
    results.map((result) => `- ${result.ok ? "OK" : "FAIL"} ${result.name}: ${result.summary}`)
  )

  const failedResult = results.find((result) => !result.ok)
  if (failedResult) {
    throw new Error(`${failedResult.name}: ${failedResult.summary}`)
  }

  log("Tam tarama tamamlandi.")
}

export async function kaliteKontrol(): Promise<void> {
  const projectDir = projectRoot
  const checklistPath = path.join(projectDir, "docs", "qa-cross-role-checklist.md")

  if (!(await pathExists(checklistPath))) {
    throw new Error("QA kontrol listesi bulunamadi.")
  }

  const checklist = await readFile(checklistPath, "utf8")
  const hasChecklistTitle = checklist.includes("Cross-Role QA Checklist")
  const hasSmokeScript = await pathExists(path.join(projectDir, "scripts", "qa-smoke.mjs"))

  await writeReport("qa-quality-report.md", [
    `- ${hasChecklistTitle ? "OK" : "FAIL"} Cross-role QA checklist basligi`,
    `- ${hasSmokeScript ? "OK" : "FAIL"} QA smoke script`,
  ])

  if (!hasChecklistTitle || !hasSmokeScript) {
    throw new Error("Kalite kontrol girdileri eksik.")
  }

  log(`Kalite kontrol tamamlandi: ${pathToFileURL(checklistPath).href}`)
}
