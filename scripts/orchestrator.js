const { spawn } = require("node:child_process");
const path = require("node:path");

const projectDirectory = process.env.PROJECT_DIR || path.resolve(__dirname, "..");
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

const serverProcess = spawn(npmCommand, ["run", "start"], {
  cwd: projectDirectory,
  env: process.env,
  stdio: "inherit",
});

const forwardSignal = (signal) => {
  if (!serverProcess.killed) {
    serverProcess.kill(signal);
  }
};

process.on("SIGINT", () => forwardSignal("SIGINT"));
process.on("SIGTERM", () => forwardSignal("SIGTERM"));

serverProcess.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
