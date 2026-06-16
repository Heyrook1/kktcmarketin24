import { existsSync } from "fs"
import { resolve } from "path"

import dotenv from "dotenv"

type AgentRole = {
  name: string
  responsibility: string
}

const agentRoles: AgentRole[] = [
  {
    name: "Product Strategist",
    responsibility: "Prioritizes Marketin24 marketplace opportunities and release goals.",
  },
  {
    name: "Engineering Lead",
    responsibility: "Coordinates implementation work across the Next.js application.",
  },
  {
    name: "Quality Advocate",
    responsibility: "Tracks verification, regressions, and production readiness.",
  },
]

export const loadEnvironment = () => {
  const envPath = resolve(process.cwd(), ".env")

  if (!existsSync(envPath)) {
    return
  }

  dotenv.config({ path: envPath, quiet: true })
}

export const renderTeamSummary = (roles: AgentRole[]) => {
  const roleLines = roles.map((role) => `- ${role.name}: ${role.responsibility}`)

  return [
    "Marketin24 autonomous software team is ready.",
    `Environment: ${process.env.NODE_ENV ?? "development"}`,
    "Active roles:",
    ...roleLines,
  ].join("\n")
}

const main = async () => {
  loadEnvironment()
  process.stdout.write(`${renderTeamSummary(agentRoles)}\n`)
}

await main()
