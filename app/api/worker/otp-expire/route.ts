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

export async function GET(request: Request) {
  // Verify this is coming from Vercel Cron (or internal)
  const authHeader = request.headers.get('authorization')
  if (
    process.env.NODE_ENV === 'production' &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await expireStaleOrders()
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    console.error('[otp-expire worker]', err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
