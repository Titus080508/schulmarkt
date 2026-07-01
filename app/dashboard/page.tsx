import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import PostGrid from '@/components/PostGrid'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import AnnouncementBanner from '@/components/AnnouncementBanner'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: posts } = await supabase
    .from('posts')
    .select('*, profiles(username, display_name)')
    .eq('status', 'active')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  const { data: allPosts } = await supabase
    .from('posts')
    .select('price, seller_id, status')
    .eq('seller_id', user.id)
    .is('deleted_at', null)

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()

  const { data: favorites } = await supabase
    .from('favorites').select('post_id').eq('user_id', user.id)

  const { data: announcements } = await supabase
    .from('announcements').select('*').eq('active', true).order('created_at', { ascending: false })

  const { count: unreadMessages } = await supabase
    .from('messages').select('*', { count: 'exact', head: true })
    .eq('receiver_id', user.id).eq('read', false)

  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
  const newCount = posts?.filter(p => new Date(p.created_at) > threeDaysAgo).length || 0
  const freeCount = posts?.filter(p => p.price === 0).length || 0
  const myListingsCount = allPosts?.length || 0

  return (
    <>
      <Navbar username={profile?.display_name || profile?.username} />
      <main style={{ background: 'var(--bg-page)', minHeight: '100vh' }}>
        <div className="hero-padding" style={{
          background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 55%, var(--color-accent) 100%)',
          padding: '22px 24px', position: 'relative', overflow: 'hidden'
        }}>
          <div className="hero-inner" style={{ position: 'relative', zIndex: 1, maxWidth: 'var(--content-max)', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div className="fade-in-up" style={{ animationDelay: '0ms' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(var(--color-bg-rgb),0.1)', border: '1px solid rgba(var(--color-bg-rgb),0.25)', color: 'var(--text-on-dark)', fontSize: '11px', padding: '3px 10px', borderRadius: '4px', marginBottom: '8px', letterSpacing: '0.04em' }}>
                Erzb. Liebfrauenschule Köln
              </div>
              <h2 style={{ fontSize: '18px', fontWeight: 500, color: 'var(--text-on-dark)', marginBottom: '3px' }}>Hallo, {profile?.display_name || profile?.username}</h2>
              <p style={{ fontSize: '12px', color: 'rgba(var(--color-bg-rgb),0.7)', marginBottom: '12px', maxWidth: '400px' }}>
                Kaufe und verkaufe Artikel von Mitschülern.
              </p>
              <a href="/create" className="hero-cta-modern" style={{ background: 'var(--color-bg)', color: 'var(--color-primary)', fontSize: '13px', fontWeight: 700, border: 'none', borderRadius: '4px', padding: '10px 20px', textDecoration: 'none', display: 'inline-block', boxShadow: 'var(--shadow-md)' }}>
                + Artikel einstellen
              </a>
            </div>
            <div className="hero-stats" style={{ display: 'flex', gap: '12px', flexShrink: 0 }}>
              {[
                { num: newCount, label: 'Neue Angebote' },
                { num: freeCount, label: 'Kostenlose Artikel' },
                { num: myListingsCount, label: 'Meine Anzeigen' },
                { num: unreadMessages || 0, label: 'Nachrichten', highlight: (unreadMessages || 0) > 0 },
              ].map((s, i) => (
                <div key={s.label} className="stat-card-modern" style={{ animationDelay: `${i * 70}ms`, textAlign: 'center', background: 'rgba(var(--color-bg-rgb),0.08)', border: '1px solid rgba(var(--color-bg-rgb),0.15)', borderRadius: '8px', padding: '10px 14px' }}>
                  <div style={{ fontSize: '19px', fontWeight: 500, color: s.highlight ? 'var(--color-accent-on-dark)' : 'rgba(var(--color-bg-rgb),0.92)' }}>{s.num}</div>
                  <div style={{ fontSize: '11px', color: 'rgba(var(--color-bg-rgb),0.6)', marginTop: '2px' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <AnnouncementBanner announcements={announcements || []} />

        <div className="main-padding" style={{ padding: '24px' }}>
          <div style={{ maxWidth: 'var(--content-max)', margin: '0 auto' }}>
            <PostGrid posts={posts || []} currentUserId={user.id} initialFavoriteIds={favorites?.map(f => f.post_id) || []} />
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}