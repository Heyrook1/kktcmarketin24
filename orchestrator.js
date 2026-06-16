require("dotenv").config({ quiet: true });

const startedAt = new Date().toISOString();
const teamName = process.env.MARKETIN24_TEAM_NAME ?? "marketin24-team";
const runMode = process.env.MARKETIN24_TEAM_MODE ?? "standby";

process.stdout.write(
  JSON.stringify(
    {
      service: "marketin24-agent-team",
      teamName,
      runMode,
      status: "ready",
      startedAt,
    },
    null,
    2,
  ),
);
process.stdout.write("\n");
