import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  const { messageId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })

  const { reason } = await request.json()

  const { data: reporter } = await supabase
    .from('profiles').select('username').eq('id', user.id).single()

  const { data: message } = await supabase
    .from('messages').select('sender_id, receiver_id, content').eq('id', messageId).single()

  if (!message) return NextResponse.json({ error: 'Nachricht nicht gefunden' }, { status: 404 })

  const reportedId = message.sender_id === user.id ? message.receiver_id : message.sender_id

  const { error: insertError } = await supabase.from('message_reports').insert({
    message_id: messageId,
    reporter_id: user.id,
    reported_id: reportedId,
    reason
  })

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 400 })
  }

  const { data: admins } = await supabase
    .from('profiles').select('id').eq('is_admin', true)

  if (admins) {
    for (const admin of admins) {
      await supabase.from('notifications').insert({
        user_id: admin.id,
        type: 'report',
        message: `${reporter?.username} hat eine Nachricht gemeldet. Grund: ${reason}`,
        link: '/admin/reports'
      })
    }
  }

  return NextResponse.json({ success: true })
}
