/**
 * GET /api/vendor/notifications
 *
 * Vendor notification polling endpoint.
 *
 * Reads up to `limit` messages from the Redis list `vendor:{storeId}:notifications`
 * and returns them in chronological order (oldest first).
 *
 * The vendor dashboard polls this endpoint every 30s to surface new
 * order events without requiring a WebSocket connection.
 *
 * Query params:
 *  - storeId (required)
 *  - limit   (optional, default 20, max 50)
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { redis } from '@/lib/redis'
import { createClient as serviceClient } from '@supabase/supabase-js'
import { z } from 'zod'

const querySchema = z.object({
  storeId: z.string().uuid('Geçersiz mağaza kimliği.'),
  limit: z.coerce.number().int().min(1).max(50).default(20),
})

export async function GET(req: NextRequest) {
  try {
    const parsedQuery = querySchema.safeParse({
      storeId: req.nextUrl.searchParams.get('storeId'),
      limit: req.nextUrl.searchParams.get('limit') ?? '20',
    })
    if (!parsedQuery.success) {
      return NextResponse.json(
        { error: parsedQuery.error.issues[0]?.message ?? 'Geçersiz sorgu parametreleri.' },
        { status: 400 },
      )
    }

    const { storeId, limit } = parsedQuery.data

    // Verify the caller owns this store
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sb = serviceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: store } = await sb
      .from('vendor_stores')
      .select('id')
      .eq('id', storeId)
      .eq('owner_id', user.id)
      .maybeSingle()

    if (!store) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Read and trim the Redis notification list
    const notifyKey = `vendor:${storeId}:notifications`
    const raw = await redis.lrange<string>(notifyKey, 0, limit - 1)

    // Parse — oldest messages are at the end of the list (lpush prepends)
    const notifications = (raw ?? [])
      .map((item) => {
        try {
          return typeof item === 'string' ? JSON.parse(item) : item
        } catch {
          return null
        }
      })
      .filter(Boolean)
      .reverse() // oldest first

    return NextResponse.json({ notifications })
  } catch {
    return NextResponse.json({ error: 'Bildirimler alınamadı.' }, { status: 500 })
  }
}
