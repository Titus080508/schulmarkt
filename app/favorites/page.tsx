import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import PostGrid from '@/components/PostGrid'

export default async function FavoritesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()

  const { data: favorites } = await supabase
    .from('favorites').select('post_id').eq('user_id', user.id)

  const postIds = favorites?.map(f => f.post_id) || []

  const { data: posts } = postIds.length > 0
    ? await supabase
        .from('posts')
        .select('*, profiles(username, display_name)')
        .in('id', postIds)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
    : { data: [] }

  return (
    <>
      <Navbar username={profile?.display_name || profile?.username} />
      <main style={{ background: 'var(--bg-page)', minHeight: '100vh', padding: '24px 20px' }}>
        <div style={{ maxWidth: 'var(--content-max)', margin: '0 auto' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 500, color: 'var(--color-primary)', marginBottom: '4px' }}>Meine Favoriten</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>{postIds.length} gespeicherte Artikel</p>

          {postIds.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-faint)' }}>
              <p style={{ fontSize: '14px' }}>Du hast noch keine Artikel favorisiert.</p>
            </div>
          )}

          {postIds.length > 0 && (
            <PostGrid posts={posts || []} currentUserId={user.id} initialFavoriteIds={postIds} />
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
