"use client"

import { useEffect, useMemo, useState } from "react"
import { AlertTriangle, LifeBuoy, Loader2, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ThreadChatPanel } from "@/components/shared/thread-chat-panel"
import { createClient } from "@/lib/supabase/client"

type VendorAdminThread = {
  id: string
  subject: string
  storeId: string | null
  storeName: string
  vendorOrderId: string | null
  updatedAt: string
  lastMessageAt: string
}

export function VendorAdminInbox({ mode }: { mode: "vendor" | "admin" }) {
  const [threads, setThreads] = useState<VendorAdminThread[]>([])
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [vendorOrderId, setVendorOrderId] = useState("")
  const [creating, setCreating] = useState(false)

  async function loadThreads() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/messages/vendor-admin", { cache: "no-store" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError((data as { error?: string }).error ?? "Destek mesajlari alinamadi.")
        return
      }
      const list = ((data as { threads?: VendorAdminThread[] }).threads ?? []).sort(
        (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime(),
      )
      setThreads(list)
      setSelectedThreadId((prev) => prev ?? list[0]?.id ?? null)
    } catch {
      setError("Baglanti hatasi.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadThreads()
  }, [])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`vendor-admin-thread-list-${mode}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "support_threads" }, () => {
        void loadThreads()
      })
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  async function createThread() {
    const trimmedMessage = message.trim()
    if (!trimmedMessage) return
    setCreating(true)
    setError(null)
    try {
      const res = await fetch("/api/messages/vendor-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subject.trim() || "Destek talebi",
          message: trimmedMessage,
          vendorOrderId: vendorOrderId.trim() || null,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError((data as { error?: string }).error ?? "Destek talebi olusturulamadi.")
        return
      }
      setSubject("")
      setMessage("")
      setVendorOrderId("")
      await loadThreads()
      const createdThreadId = (data as { threadId?: string }).threadId ?? null
      if (createdThreadId) setSelectedThreadId(createdThreadId)
    } catch {
      setError("Baglanti hatasi.")
    } finally {
      setCreating(false)
    }
  }

  const selected = useMemo(
    () => threads.find((thread) => thread.id === selectedThreadId) ?? null,
    [threads, selectedThreadId],
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <LifeBuoy className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">
          {mode === "vendor" ? "Admin Destek Mesajlari" : "Vendor Destek Kutusu"}
        </h2>
      </div>

      {mode === "vendor" && (
        <div className="rounded-lg border p-3 space-y-2">
          <p className="text-sm font-medium">Yeni destek talebi</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="support-subject">Konu</Label>
              <Input
                id="support-subject"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                placeholder="Orn. Kargo entegrasyonu sorunu"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="support-vendor-order">Vendor order id (opsiyonel)</Label>
              <Input
                id="support-vendor-order"
                value={vendorOrderId}
                onChange={(event) => setVendorOrderId(event.target.value)}
                placeholder="uuid"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="support-message">Mesaj</Label>
            <Textarea
              id="support-message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={4}
              placeholder="Yasadiginiz problemi detaylandirin..."
            />
          </div>
          <div className="flex justify-end">
            <Button size="sm" onClick={() => void createThread()} disabled={creating || !message.trim()}>
              {creating ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Gonderiliyor</> : "Talep Ac"}
            </Button>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-lg border p-2 space-y-1 max-h-[460px] overflow-y-auto">
          <div className="flex items-center justify-between px-1 py-1">
            <p className="text-xs text-muted-foreground">Thread listesi</p>
            <Button size="sm" variant="outline" onClick={() => void loadThreads()} disabled={loading}>
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Yenile"}
            </Button>
          </div>
          {threads.length === 0 && !loading && (
            <p className="text-xs text-muted-foreground px-2 py-4">Henuz thread yok.</p>
          )}
          {threads.map((thread) => (
            <button
              key={thread.id}
              type="button"
              onClick={() => setSelectedThreadId(thread.id)}
              className={`w-full rounded-md border px-2.5 py-2 text-left transition ${selectedThreadId === thread.id ? "border-primary bg-primary/5" : "hover:bg-muted/40"}`}
            >
              <p className="text-sm font-medium line-clamp-1">{thread.subject}</p>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{thread.storeName}</p>
              <p className="text-[11px] text-muted-foreground mt-1">{new Date(thread.lastMessageAt).toLocaleString("tr-TR")}</p>
            </button>
          ))}
        </div>

        <div className="lg:col-span-2">
          {selected ? (
            <ThreadChatPanel
              endpoint={`/api/messages/vendor-admin/${selected.id}/messages`}
              title={`${mode === "vendor" ? "Admin ile" : "Vendor ile"} mesajlasma`}
              placeholder="Mesajinizi yazin..."
              emptyText="Bu thread'de henuz mesaj yok."
            />
          ) : (
            <div className="rounded-lg border p-6 text-sm text-muted-foreground flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Bir thread secin veya yeni thread olusturun.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
