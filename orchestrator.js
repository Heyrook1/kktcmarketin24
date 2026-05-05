const { existsSync } = require("fs")
const { resolve } = require("path")

const dotenv = require("dotenv")

const agentRoles = [
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

const loadEnvironment = () => {
  const envPath = resolve(process.cwd(), ".env")

  if (!existsSync(envPath)) {
    return
  }

  dotenv.config({ path: envPath, quiet: true })
}

const renderTeamSummary = (roles) => {
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

main().catch((error) => {
  process.stderr.write(`Marketin24 autonomous team failed to start: ${error instanceof Error ? error.message : String(error)}\n`)
  process.exitCode = 1
})
