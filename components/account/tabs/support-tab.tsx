"use client"

import { useState } from "react"
import {
  HeadphonesIcon, Plus, Send, MessageSquare, Clock,
  CheckCircle, AlertCircle, ChevronDown, ChevronUp, Package,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useAccountStore, SupportTicket, SupportStatus, SupportCategory } from "@/lib/store/account-store"
import { cn } from "@/lib/utils"

const STATUS_CONFIG: Record<SupportStatus, { label: string; color: string; icon: React.ElementType }> = {
  open:        { label: "Acik",          color: "bg-amber-100 text-amber-700 border-amber-200",  icon: AlertCircle },
  in_progress: { label: "Islemde",       color: "bg-blue-100 text-blue-700 border-blue-200",     icon: Clock },
  resolved:    { label: "Cozuldu",       color: "bg-green-100 text-green-700 border-green-200",  icon: CheckCircle },
  closed:      { label: "Kapandi",       color: "bg-gray-100 text-gray-600 border-gray-200",     icon: CheckCircle },
}

const CATEGORY_LABELS: Record<SupportCategory, string> = {
  order: "Siparis", payment: "Odeme", delivery: "Teslimat",
  product: "Urun", return: "Iade", other: "Diger",
}

function TicketCard({ ticket }: { ticket: SupportTicket }) {
  const [expanded, setExpanded] = useState(false)
  const [reply, setReply] = useState("")
  const { replyToTicket } = useAccountStore()
  const cfg = STATUS_CONFIG[ticket.status]
  const StatusIcon = cfg.icon
  const canReply = ticket.status !== "closed"

  function sendReply(e: React.FormEvent) {
    e.preventDefault()
    if (!reply.trim()) return
    replyToTicket(ticket.id, reply.trim())
    setReply("")
  }

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <button
        className="w-full flex items-center justify-between gap-3 px-5 py-4 hover:bg-secondary/40 transition-colors text-left"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{ticket.subject}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-muted-foreground">{ticket.id}</span>
              <span className="text-xs text-muted-foreground">·</span>
              <Badge variant="outline" className="text-[10px] h-4 px-1.5">{CATEGORY_LABELS[ticket.category]}</Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={cn("inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full border", cfg.color)}>
            <StatusIcon className="h-3 w-3" />
            {cfg.label}
          </span>
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t">
          {/* Messages */}
          <div className="px-5 py-4 space-y-3 max-h-80 overflow-y-auto">
            {ticket.messages.map((msg) => (
              <div key={msg.id} className={cn("flex gap-2.5", msg.sender === "user" ? "justify-end" : "justify-start")}>
                {msg.sender === "support" && (
                  <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <HeadphonesIcon className="h-3.5 w-3.5 text-primary" />
                  </div>
                )}
                <div className={cn(
                  "max-w-[80%] rounded-xl px-3.5 py-2.5 text-sm",
                  msg.sender === "user"
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-secondary text-foreground rounded-bl-sm"
                )}>
                  <p className="leading-relaxed">{msg.content}</p>
                  <p className={cn("text-[10px] mt-1.5", msg.sender === "user" ? "text-primary-foreground/70 text-right" : "text-muted-foreground")}>
                    {new Date(msg.timestamp).toLocaleString("tr-TR", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Reply */}
          {canReply && (
            <>
              <Separator />
              <form onSubmit={sendReply} className="px-5 py-3 flex gap-2">
                <Textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Yanıtınızı yazın..."
                  rows={2}
                  className="resize-none flex-1 text-sm"
                />
                <Button type="submit" size="icon" disabled={!reply.trim()} className="self-end h-9 w-9">
                  <Send className="h-4 w-4" />
                  <span className="sr-only">Gonder</span>
                </Button>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function SupportTab({ userId }: { userId: string }) {
  const { tickets, orders, createTicket } = useAccountStore()
  const [showNew, setShowNew] = useState(false)
  const [newForm, setNewForm] = useState({
    subject: "", category: "" as SupportCategory | "", relatedOrderId: "", initialMessage: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  function validate() {
    const e: Record<string, string> = {}
    if (!newForm.subject.trim()) e.subject = "Konu zorunludur."
    if (!newForm.category) e.category = "Kategori secin."
    if (!newForm.initialMessage.trim() || newForm.initialMessage.length < 20)
      e.initialMessage = "Aciklama en az 20 karakter olmalidir."
    return e
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setSubmitting(true)
    setTimeout(() => {
      createTicket({
        subject: newForm.subject,
        category: newForm.category as SupportCategory,
        relatedOrderId: newForm.relatedOrderId || undefined,
        initialMessage: newForm.initialMessage,
      })
      setNewForm({ subject: "", category: "", relatedOrderId: "", initialMessage: "" })
      setShowNew(false)
      setSubmitting(false)
    }, 700)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Destek Taleplerim ({tickets.length})</h2>
        <Button size="sm" className="gap-1.5" onClick={() => setShowNew((v) => !v)}>
          <Plus className="h-4 w-4" />
          {showNew ? "Iptal" : "Yeni Talep"}
        </Button>
      </div>

      {/* New ticket form */}
      {showNew && (
        <div className="rounded-xl border bg-card p-5 space-y-4 animate-slide-in-up">
          <h3 className="font-semibold text-sm">Yeni Destek Talebi Olustur</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="sup-subject" className={errors.subject ? "text-destructive" : ""}>Konu</Label>
              <Input
                id="sup-subject"
                placeholder="Talebinizi kisaca aciklayin"
                value={newForm.subject}
                onChange={(e) => setNewForm((f) => ({ ...f, subject: e.target.value }))}
                className={errors.subject ? "border-destructive" : ""}
              />
              {errors.subject && <p className="text-xs text-destructive">{errors.subject}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className={errors.category ? "text-destructive" : ""}>Kategori</Label>
                <Select
                  value={newForm.category}
                  onValueChange={(v) => setNewForm((f) => ({ ...f, category: v as SupportCategory }))}
                >
                  <SelectTrigger className={errors.category ? "border-destructive" : ""}>
                    <SelectValue placeholder="Kategori secin" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
                      <SelectItem key={v} value={v}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && <p className="text-xs text-destructive">{errors.category}</p>}
              </div>

              <div className="space-y-1.5">
                <Label>Ilgili Siparis (opsiyonel)</Label>
                <Select
                  value={newForm.relatedOrderId}
                  onValueChange={(v) => setNewForm((f) => ({ ...f, relatedOrderId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Siparis secin" />
                  </SelectTrigger>
                  <SelectContent>
                    {orders.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        <span className="flex items-center gap-2">
                          <Package className="h-3.5 w-3.5" />
                          {o.id}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sup-msg" className={errors.initialMessage ? "text-destructive" : ""}>Aciklama</Label>
              <Textarea
                id="sup-msg"
                placeholder="Sorununuzu detayli bir sekilde aciklayin (en az 20 karakter)..."
                rows={4}
                value={newForm.initialMessage}
                onChange={(e) => setNewForm((f) => ({ ...f, initialMessage: e.target.value }))}
                className={cn("resize-none", errors.initialMessage ? "border-destructive" : "")}
              />
              {errors.initialMessage && <p className="text-xs text-destructive">{errors.initialMessage}</p>}
              <p className="text-xs text-muted-foreground text-right">{newForm.initialMessage.length} / 20+ karakter</p>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" type="button" onClick={() => setShowNew(false)}>Iptal</Button>
              <Button type="submit" disabled={submitting} className="gap-1.5">
                <Send className="h-4 w-4" />
                {submitting ? "Gonderiliyor..." : "Talebi Gonder"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Ticket list */}
      {tickets.length === 0 ? (
        <div className="rounded-xl border py-16 text-center bg-card">
          <HeadphonesIcon className="mx-auto h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">Henuz destek talebiniz bulunmuyor.</p>
          <Button variant="link" size="sm" className="mt-1" onClick={() => setShowNew(true)}>
            Ilk talebinizi olusturun
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => <TicketCard key={t.id} ticket={t} />)}
        </div>
      )}
    </div>
  )
}
