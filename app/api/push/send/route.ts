import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import webpush from 'web-push'

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  const { receiverId, title, body, url } = await req.json()
  if (!receiverId) return NextResponse.json({ error: 'receiverId fehlt' }, { status: 400 })

  const { data: subs } = await supabase
    .from('push_subscriptions').select('*').eq('user_id', receiverId)

  await Promise.all((subs || []).map(async sub => {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify({ title, body, url })
      )
    } catch (err: any) {
      if (err?.statusCode === 404 || err?.statusCode === 410) {
        await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
      }
    }
  }))

  return NextResponse.json({ ok: true })
}
