/**
 * GET /api/worker/outbox-flush
 *
 * Outbox worker — polls pending outbox_events and delivers them.
 *
 * Design:
 *  - Uses the service-role key to read/update outbox_events (RLS bypassed).
 *  - Claims up to BATCH_SIZE events atomically with a status='processing' update.
 *  - For each event, pushes a notification message into a Redis list keyed by
 *    storeId: `vendor:{storeId}:notifications`. Vendor dashboards can subscribe to
 *    these via SSE or polling (/api/vendor/notifications).
 *  - On success: marks event as published.
 *  - On failure: increments attempts, marks as failed (retried next poll cycle).
 *  - Events with attempts >= MAX_ATTEMPTS are left as 'failed' for manual review.
 *
 * In production this endpoint is called by a Vercel Cron Job (vercel.json):
 *  { "crons": [{ "path": "/api/worker/outbox-flush", "schedule": "* * * * *" }] }
 *
 * It can also be triggered manually or from a Vercel Edge Function for lower latency.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { redis } from '@/lib/redis'
import { z } from 'zod'

const BATCH_SIZE = 20
const MAX_ATTEMPTS = 5
const NOTIFY_TTL = 60 * 60 * 24 * 7 // 7 days in seconds
const keySchema = z.string().uuid()

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    if (!cronSecret) {
      return NextResponse.json({ error: 'Cron secret yapılandırılmadı.' }, { status: 503 })
    }
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = serviceClient()

    // Claim a batch of pending events
    const { data: events, error: fetchErr } = await supabase
      .from('outbox_events')
      .select('id, aggregate_type, aggregate_id, event_type, payload, attempts')
      .eq('status', 'pending')
      .lt('attempts', MAX_ATTEMPTS)
      .lte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(BATCH_SIZE)

    if (fetchErr || !events || events.length === 0) {
      return NextResponse.json({ processed: 0 })
    }

    const eventIds = events.map((e) => e.id)

    // Mark as processing (prevents duplicate delivery if worker runs concurrently)
    await supabase
      .from('outbox_events')
      .update({ status: 'processing' })
      .in('id', eventIds)

    const published: string[] = []
    const failed: { id: string; reason: string }[] = []

    for (const event of events) {
      try {
        const payload = event.payload as Record<string, unknown>

        // Derive the target storeId from payload
        const rawStoreId = (payload.storeId as string) ?? (payload.store_id as string)
        const storeId = keySchema.safeParse(rawStoreId)
        if (!storeId.success) {
          published.push(event.id)
          continue
        }

        // Push to Redis list: `vendor:{storeId}:notifications`
        // Each item is a JSON string; vendor polling endpoint reads and trims this list.
        const notifyKey = `vendor:${storeId.data}:notifications`
        const message = JSON.stringify({
          id: event.id,
          eventType: event.event_type,
          aggregateType: event.aggregate_type,
          aggregateId: event.aggregate_id,
          payload,
          ts: new Date().toISOString(),
        })

        await redis.lpush(notifyKey, message)
        // Keep at most 200 messages per vendor, expire key after 7 days
        await redis.ltrim(notifyKey, 0, 199)
        await redis.expire(notifyKey, NOTIFY_TTL)

        published.push(event.id)
      } catch (err) {
        const reason = err instanceof Error ? err.message : String(err)
        failed.push({ id: event.id, reason })
      }
    }

    // Update statuses
    if (published.length > 0) {
      await supabase
        .from('outbox_events')
        .update({ status: 'published', published_at: new Date().toISOString() })
        .in('id', published)
    }

    if (failed.length > 0) {
      for (const { id, reason } of failed) {
        await supabase
          .from('outbox_events')
          .update({
            status: 'failed',
            last_error: reason,
          })
          .eq('id', id)

        // Increment attempts counter
        const event = events.find((e) => e.id === id)
        if (event) {
          await supabase
            .from('outbox_events')
            .update({ attempts: (event.attempts ?? 0) + 1 })
            .eq('id', id)
        }
      }
    }

    return NextResponse.json({
      processed: events.length,
      published: published.length,
      failed: failed.length,
    })
  } catch {
    return NextResponse.json({ error: 'Outbox worker başarısız.' }, { status: 500 })
  }
}
