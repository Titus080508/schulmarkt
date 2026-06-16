import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  await supabase
    .from('posts')
    .update({ status: 'sold' })
    .eq('id', id)
    .eq('seller_id', user.id)

  redirect('/my-posts')
}