/**
 * app/api/worker/otp-expire/route.ts
 *
 * Cron worker: runs every minute via Vercel Cron.
 * Cancels orders stuck in `awaiting_otp` for longer than 15 minutes,
 * restores stock, and increments no-show counters.
 */

import { NextResponse } from 'next/server'
import { expireStaleOrders } from '@/lib/otp'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function isAuthorizedWorkerRequest(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    return false
  }

  return request.headers.get('authorization') === `Bearer ${cronSecret}`
}

export async function GET(request: Request) {
  if (!isAuthorizedWorkerRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await expireStaleOrders()
    return NextResponse.json({ ok: true, ...result })
  } catch {
    return NextResponse.json({ ok: false, error: 'Worker failed' }, { status: 500 })
  }
}
