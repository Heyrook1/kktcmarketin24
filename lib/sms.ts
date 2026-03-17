/**
 * lib/sms.ts
 *
 * SMS provider abstraction for KKTC +90 392 numbers.
 * Supports Netgsm and İletimerkezi.
 * Provider is selected by the SMS_PROVIDER env var ("netgsm" | "iletimerkezi").
 * Falls back to the other provider automatically if the primary fails.
 *
 * Number normalisation:
 *   - "05391234567"   → "+905391234567"   (Turkish mobile)
 *   - "03921234567"   → "+903921234567"   (KKTC landline-style)
 *   - "5391234567"    → "+905391234567"
 *   - "+903921234567" → "+903921234567"   (already E.164)
 */

export interface SmsSendResult {
  ok: boolean
  provider: string
  error?: string
}

// ── Number normalisation ──────────────────────────────────────────────────────

export function normalisePhone(raw: string): string {
  // Strip spaces, dashes, parentheses
  let n = raw.replace(/[\s\-().]/g, "")

  // Already E.164
  if (/^\+\d{10,15}$/.test(n)) return n

  // Turkey country code prefix
  if (n.startsWith("00")) n = "+" + n.slice(2)
  else if (n.startsWith("0"))  n = "+90" + n.slice(1)  // 05xx or 0392
  else if (/^[1-9]/.test(n))   n = "+90" + n           // bare 10-digit

  return n
}

// ── Provider: Netgsm ──────────────────────────────────────────────────────────
// Docs: https://www.netgsm.com.tr/dokuman/

async function sendViaNetgsm(
  phone: string,
  message: string
): Promise<SmsSendResult> {
  const usercode  = process.env.NETGSM_USERCODE
  const password  = process.env.NETGSM_PASSWORD
  const msgheader = process.env.NETGSM_MSGHEADER ?? "Marketin24"

  if (!usercode || !password) {
    return { ok: false, provider: "netgsm", error: "Netgsm credentials not configured." }
  }

  const normalised = normalisePhone(phone)
  // Netgsm expects the number without the leading +
  const gsm = normalised.replace(/^\+/, "")

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<mainbody>
  <header>
    <company dil="TR">Netgsm</company>
    <usercode>${usercode}</usercode>
    <password>${password}</password>
    <type>1:n</type>
    <msgheader>${msgheader}</msgheader>
  </header>
  <body>
    <msg><![CDATA[${message}]]></msg>
    <no>${gsm}</no>
  </body>
</mainbody>`

  try {
    const res = await fetch("https://api.netgsm.com.tr/sms/send/xml", {
      method: "POST",
      headers: { "Content-Type": "text/xml; charset=UTF-8" },
      body: xml,
    })
    const text = await res.text()
    // Netgsm returns a code: "00" or "01" = success
    const success = /^0[01]/.test(text.trim())
    if (!success) {
      return { ok: false, provider: "netgsm", error: `Netgsm error: ${text.trim()}` }
    }
    return { ok: true, provider: "netgsm" }
  } catch (err) {
    return { ok: false, provider: "netgsm", error: String(err) }
  }
}

// ── Provider: İletimerkezi ────────────────────────────────────────────────────
// Docs: https://www.iletimerkezi.com/en/developer

async function sendViaIletimerkezi(
  phone: string,
  message: string
): Promise<SmsSendResult> {
  const username   = process.env.ILETIMERKEZI_USERNAME
  const password   = process.env.ILETIMERKEZI_PASSWORD
  const originator = process.env.ILETIMERKEZI_ORIGINATOR ?? "Marketin24"

  if (!username || !password) {
    return { ok: false, provider: "iletimerkezi", error: "İletimerkezi credentials not configured." }
  }

  const normalised = normalisePhone(phone)

  try {
    const res = await fetch("https://api.iletimerkezi.com/v1/send-sms/json", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        request: {
          authentication: { username, password },
          order: {
            sender: originator,
            sendDateTime: "",
            message: {
              text: message,
              receipients: { number: [normalised] },
            },
          },
        },
      }),
    })
    const data = await res.json() as { response?: { status?: { code?: number } } }
    const code = data?.response?.status?.code
    if (code !== 200) {
      return { ok: false, provider: "iletimerkezi", error: `İletimerkezi error code: ${code}` }
    }
    return { ok: true, provider: "iletimerkezi" }
  } catch (err) {
    return { ok: false, provider: "iletimerkezi", error: String(err) }
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Send an SMS using the configured provider with automatic fallback.
 * In development (no credentials) this is a no-op and returns ok=true
 * so that local testing is not blocked.
 */
export async function sendSms(phone: string, message: string): Promise<SmsSendResult> {
  const primary = (process.env.SMS_PROVIDER ?? "netgsm").toLowerCase()

  const providers: Array<(p: string, m: string) => Promise<SmsSendResult>> =
    primary === "iletimerkezi"
      ? [sendViaIletimerkezi, sendViaNetgsm]
      : [sendViaNetgsm, sendViaIletimerkezi]

  let lastError: SmsSendResult | null = null

  for (const send of providers) {
    const result = await send(phone, message)
    if (result.ok) return result
    lastError = result
    console.error(`[sms] provider ${result.provider} failed:`, result.error)
  }

  return lastError ?? { ok: false, provider: "none", error: "All SMS providers failed." }
}

/**
 * Build the OTP message text.
 * Keeping it short keeps it within a single SMS segment.
 */
export function otpMessage(code: string): string {
  return `Marketin24 siparis dogrulama kodunuz: ${code}. 15 dakika gecerlidir. Bu kodu kimseyle paylasmayiniz.`
}
