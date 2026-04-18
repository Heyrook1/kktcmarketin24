import { spawn } from "node:child_process";

type RunnerOptions = {
  command: string;
  args: string[];
  label: string;
};

export async function runCommand({
  command,
  args,
  label,
}: RunnerOptions): Promise<void> {
  const projectDir = process.env.PROJECT_DIR ?? process.cwd();

  await new Promise<void>((resolve, reject) => {
    const childProcess = spawn(command, args, {
      cwd: projectDir,
      stdio: "inherit",
      env: process.env,
      shell: process.platform === "win32",
    });

    childProcess.on("error", (error) => {
      reject(new Error(`${label} komutu baslatilamadi: ${error.message}`));
    });

    childProcess.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${label} basarisiz oldu (cikis kodu: ${code ?? "null"})`));
    });
  });
}
