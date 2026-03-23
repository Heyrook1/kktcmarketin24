import { execSync } from "child_process"
import { existsSync, unlinkSync } from "fs"
import { join } from "path"

const root = "/vercel/share/v0-project"
const lockfile = join(root, "pnpm-lock.yaml")

if (existsSync(lockfile)) {
  unlinkSync(lockfile)
  console.log("Deleted corrupted pnpm-lock.yaml")
}

execSync("pnpm install --no-frozen-lockfile", {
  cwd: root,
  stdio: "inherit",
})

console.log("pnpm-lock.yaml regenerated successfully")
