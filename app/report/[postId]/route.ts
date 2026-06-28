import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { postId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })

  const { reason } = await request.json()

  const { data: reporter } = await supabase
    .from('profiles').select('username').eq('id', user.id).single()

  const { data: post } = await supabase
    .from('posts').select('title, seller_id').eq('id', postId).single()

  const { error: insertError } = await supabase.from('reports').insert({
    post_id: postId,
    reporter_id: user.id,
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
        message: `${reporter?.username} hat den Post "${post?.title}" gemeldet. Grund: ${reason}`,
        link: `/post/${postId}`
      })
    }
  }

  return NextResponse.json({ success: true })
}