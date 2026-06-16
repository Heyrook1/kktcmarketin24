import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

export type Logger = (message: string) => void;

export interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export function resolveProjectDirectory(): string {
  return process.env.PROJECT_DIR || process.cwd();
}

export function createLogger(logDirectory: string, scope: string): Logger {
  return (message: string) => {
    const line = `[${new Date().toISOString()}] [${scope}] ${message}`;
    process.stdout.write(`${line}\n`);
    fs.mkdirSync(logDirectory, { recursive: true });
    fs.appendFileSync(path.join(logDirectory, `${scope.toLowerCase()}.log`), `${line}\n`, "utf8");
  };
}

export function createScopedLogger(baseLogger: Logger, scope: string): Logger {
  return (message: string) => {
    baseLogger(`[${scope}] ${message}`);
  };
}

export async function runCommand(
  command: string,
  args: string[],
  options: { cwd: string; env?: NodeJS.ProcessEnv } = { cwd: process.cwd() },
): Promise<CommandResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: options.env ?? process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      reject(error);
    });

    child.on("close", (exitCode) => {
      resolve({
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        exitCode: exitCode ?? 0,
      });
    });
  });
}

export function summarizeCommandOutput(result: CommandResult, maxLength = 280): string {
  const stderrText = result.stderr.trim();
  if (stderrText.length > 0) {
    return stderrText.slice(0, maxLength);
  }

  const stdoutText = result.stdout.trim();
  if (stdoutText.length > 0) {
    return stdoutText.slice(0, maxLength);
  }

  return `Komut cikis kodu ${result.exitCode} ile tamamlandi.`;
}

export function getDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function loadEnvironmentFiles(projectDirectory: string): void {
  const environmentFiles = [".env.local", ".env"];

  for (const fileName of environmentFiles) {
    const filePath = path.join(projectDirectory, fileName);
    if (!fs.existsSync(filePath)) {
      continue;
    }

    const fileContent = fs.readFileSync(filePath, "utf8");
    const lines = fileContent.split(/\r?\n/u);

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.length === 0 || trimmedLine.startsWith("#")) {
        continue;
      }

      const separatorIndex = trimmedLine.indexOf("=");
      if (separatorIndex < 1) {
        continue;
      }

      const variableName = trimmedLine.slice(0, separatorIndex).trim();
      const rawValue = trimmedLine.slice(separatorIndex + 1).trim();
      const normalizedValue = rawValue.replace(/^['"]|['"]$/gu, "");

      if (!process.env[variableName]) {
        process.env[variableName] = normalizedValue;
      }
    }
  }
}

export function ensureFileExists(absolutePath: string): void {
  if (fs.existsSync(absolutePath)) {
    return;
  }

  throw new Error(`Beklenen dosya bulunamadi: ${absolutePath}`);
}

export function readTextFile(absolutePath: string): string {
  ensureFileExists(absolutePath);
  return fs.readFileSync(absolutePath, "utf8");
}

export function collectFilesRecursively(
  rootDirectory: string,
  filePredicate: (fileName: string) => boolean,
): string[] {
  if (!fs.existsSync(rootDirectory)) {
    return [];
  }

  const collectedFiles: string[] = [];
  const entries = fs.readdirSync(rootDirectory, { withFileTypes: true });

  for (const entry of entries) {
    const absoluteEntryPath = path.join(rootDirectory, entry.name);

    if (entry.isDirectory()) {
      collectedFiles.push(...collectFilesRecursively(absoluteEntryPath, filePredicate));
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    if (filePredicate(entry.name)) {
      collectedFiles.push(absoluteEntryPath);
    }
  }

  return collectedFiles;
}
