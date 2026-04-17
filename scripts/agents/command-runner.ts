import { spawn } from "node:child_process"

import type { AgentContext } from "./types"

interface CommandOptions {
  command: string
  timeoutMs?: number
}

function sonSatirlariGetir(metin: string, satirSayisi: number): string {
  const satirlar = metin.split(/\r?\n/).filter((satir) => satir.trim().length > 0)
  return satirlar.slice(-satirSayisi).join("\n")
}

export async function projeKomutuCalistir(
  context: AgentContext,
  options: CommandOptions,
): Promise<void> {
  const timeoutMs = options.timeoutMs ?? 15 * 60 * 1000

  context.log(`$ ${options.command}`)

  await new Promise<void>((resolve, reject) => {
    const childProcess = spawn("bash", ["-lc", options.command], {
      cwd: context.projectDirectory,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    })

    let standardOutput = ""
    let standardError = ""

    const zamanAsimi = setTimeout(() => {
      childProcess.kill("SIGTERM")
      reject(new Error(`Komut zaman aşımına uğradı (${timeoutMs} ms): ${options.command}`))
    }, timeoutMs)

    childProcess.stdout.on("data", (chunk: Buffer | string) => {
      standardOutput += chunk.toString()
    })

    childProcess.stderr.on("data", (chunk: Buffer | string) => {
      standardError += chunk.toString()
    })

    childProcess.on("error", (error) => {
      clearTimeout(zamanAsimi)
      reject(error)
    })

    childProcess.on("close", (code) => {
      clearTimeout(zamanAsimi)

      if (code === 0) {
        const ozet = sonSatirlariGetir(standardOutput, 10)
        if (ozet.length > 0) {
          context.log(`Komut çıktısı (özet):\n${ozet}`)
        }
        resolve()
        return
      }

      const hataOzeti = sonSatirlariGetir(`${standardOutput}\n${standardError}`, 20)
      reject(
        new Error(
          `Komut başarısız oldu (çıkış kodu: ${code ?? "bilinmiyor"}): ${options.command}\n${hataOzeti}`,
        ),
      )
    })
  })
}
