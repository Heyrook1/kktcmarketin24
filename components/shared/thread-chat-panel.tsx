"use client"

import { useEffect, useMemo, useState } from "react"
import { Loader2, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

type ThreadMessage = {
  id: string
  senderRole: "customer" | "vendor" | "admin" | "super_admin"
  senderName: string
  body: string
  createdAt: string
}

type Props = {
  endpoint: string
  title?: string
  placeholder?: string
  emptyText?: string
  className?: string
}

export function ThreadChatPanel({
  endpoint,
  title = "Mesajlar",
  placeholder = "Mesajinizi yazin...",
  emptyText = "Henuz mesaj yok.",
  className,
}: Props) {
  const [threadId, setThreadId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ThreadMessage[]>([])
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(endpoint, { cache: "no-store" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError((data as { error?: string }).error ?? "Mesajlar yuklenemedi.")
        return
      }
      const payload = data as { threadId?: string; messages?: ThreadMessage[] }
      setThreadId(payload.threadId ?? null)
      setMessages(payload.messages ?? [])
    } catch {
      setError("Baglanti hatasi.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint])

  useEffect(() => {
    if (!threadId) return
    const supabase = createClient()
    const channel = supabase
      .channel(`thread-${threadId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "support_thread_messages", filter: `thread_id=eq.${threadId}` },
        () => {
          void load()
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId, endpoint])

  const canSend = useMemo(() => message.trim().length > 0 && !sending, [message, sending])

  async function sendMessage() {
    const text = message.trim()
    if (!text) return
    setSending(true)
    setError(null)
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError((data as { error?: string }).error ?? "Mesaj gonderilemedi.")
        return
      }
      setMessage("")
      await load()
    } catch {
      setError("Baglanti hatasi.")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className={cn("rounded-lg border p-3 space-y-3", className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium flex items-center gap-1.5">
          <MessageSquare className="h-4 w-4 text-primary" />
          {title}
        </p>
        <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Yenile"}
        </Button>
      </div>

      <div className="max-h-60 overflow-y-auto rounded-md border bg-muted/20 p-2 space-y-2">
        {!loading && messages.length === 0 && (
          <p className="text-xs text-muted-foreground px-1 py-2">{emptyText}</p>
        )}
        {messages.map((item) => (
          <div key={item.id} className="rounded-md border bg-background p-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium">{item.senderName}</p>
              <span className="text-[10px] text-muted-foreground">
                {new Date(item.createdAt).toLocaleString("tr-TR")}
              </span>
            </div>
            <p className="text-sm mt-1 whitespace-pre-wrap break-words">{item.body}</p>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <Textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder={placeholder}
          rows={3}
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
        <div className="flex justify-end">
          <Button size="sm" disabled={!canSend} onClick={() => void sendMessage()}>
            {sending ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Gonderiliyor</> : "Mesaj Gonder"}
          </Button>
        </div>
      </div>
    </div>
  )
}
