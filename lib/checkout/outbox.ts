/**
 * lib/checkout/outbox.ts
 *
 * Outbox pattern helpers.
 *
 * Events are written to public.outbox_events in the SAME database transaction
 * as the order/sub-order rows. A separate worker (/api/worker/outbox-flush)
 * polls pending events and delivers them (e.g. pushes to a Redis queue that
 * vendor dashboards subscribe to).
 *
 * Using the service-role client so INSERT bypasses RLS.
 */

import { createClient } from '@supabase/supabase-js'

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export type OutboxEventType =
  | 'vendor.order.created'
  | 'vendor.order.compensated'
  | 'vendor.sub_order.step_failed'
  | 'customer.order.status_updated'

export async function insertOutboxEvent(
  aggregateType: 'order' | 'sub_order',
  aggregateId: string,
  eventType: OutboxEventType,
  payload: Record<string, unknown>
): Promise<void> {
  const sb = serviceClient()
  const { error } = await sb.from('outbox_events').insert({
    aggregate_type: aggregateType,
    aggregate_id: aggregateId,
    event_type: eventType,
    payload,
    status: 'pending',
  })
  if (error) {
    console.error('[outbox] insert failed', error.message)
    // Non-fatal: saga has already succeeded; worker will retry missed events
  }
}

/**
 * Mark outbox events as published (called by the worker after delivery).
 */
export async function markOutboxPublished(ids: string[]): Promise<void> {
  if (ids.length === 0) return
  const sb = serviceClient()
  await sb
    .from('outbox_events')
    .update({ status: 'published', published_at: new Date().toISOString() })
    .in('id', ids)
}

/**
 * Mark outbox events as failed with a reason (worker increments attempts).
 */
export async function markOutboxFailed(
  ids: string[],
  reason: string
): Promise<void> {
  if (ids.length === 0) return
  const sb = serviceClient()
  await sb
    .from('outbox_events')
    .update({ status: 'failed', last_error: reason })
    .in('id', ids)
  await sb.rpc('increment_outbox_attempts', { event_ids: ids }).maybeSingle()
}
