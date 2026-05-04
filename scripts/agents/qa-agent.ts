import path from "node:path"
import {
  type AgentContext,
  createAgentLog,
  getFileInventory,
  pathExists,
  readProjectFile,
  runPnpmScript,
} from "./shared"

const requiredProjectFiles = [
  "app/layout.tsx",
  "app/page.tsx",
  "components/layout/site-header.tsx",
  "components/layout/footer.tsx",
  "docs/qa-cross-role-checklist.md",
  "scripts/qa-smoke.mjs",
]

export async function tamTarama(context: AgentContext): Promise<void> {
  const log = createAgentLog(context, "QA")
  await log("Tam site taraması başladı.")

  await assertRequiredFiles(context)
  const result = await runPnpmScript(context.projectDir, "test:qa")
  await log(`${result.command} başarıyla tamamlandı.${formatCommandOutput(result.output)}`)

  await log("Tam site taraması tamamlandı.")
}

export async function kaliteKontrol(context: AgentContext): Promise<void> {
  const log = createAgentLog(context, "QA")
  await log("Kalite kontrol başladı.")

  const lintResult = await runPnpmScript(context.projectDir, "lint")
  await log(`${lintResult.command} başarıyla tamamlandı.${formatCommandOutput(lintResult.output)}`)

  const typecheckResult = await runPnpmScript(context.projectDir, "typecheck")
  await log(`${typecheckResult.command} başarıyla tamamlandı.${formatCommandOutput(typecheckResult.output)}`)

  await log("Kalite kontrol tamamlandı.")
}

async function assertRequiredFiles(context: AgentContext): Promise<void> {
  const missingFiles: string[] = []

  for (const relativePath of requiredProjectFiles) {
    if (!(await pathExists(path.join(context.projectDir, relativePath)))) {
      missingFiles.push(relativePath)
    }
  }

  if (missingFiles.length > 0) {
    throw new Error(`Eksik kritik dosyalar: ${missingFiles.join(", ")}`)
  }

  const inventory = await getFileInventory(context.projectDir)
  if (inventory.pages.length === 0) {
    throw new Error("App Router sayfası bulunamadı.")
  }

  const qaChecklist = await readProjectFile(context.projectDir, "docs/qa-cross-role-checklist.md")
  if (!qaChecklist.includes("Cross-Role QA Checklist")) {
    throw new Error("QA kontrol listesi beklenen başlığı içermiyor.")
  }
}

function formatCommandOutput(output: string): string {
  if (!output) {
    return ""
  }

  return `\n${output}`
}
