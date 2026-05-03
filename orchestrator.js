#!/usr/bin/env node

const { config } = require("dotenv")

config({ quiet: true })

const lines = [
  "Marketin24 autonomous software team orchestrator is ready.",
  "Scheduled and issue-driven automation is configured through GitHub workflows.",
]

process.stdout.write(`${lines.join("\n")}\n`)
