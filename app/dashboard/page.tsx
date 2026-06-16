import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import PostGrid from '@/components/PostGrid'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: posts } = await supabase
    .from('posts')
    .select('*, profiles(username, display_name)')
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  const { data: allPosts } = await supabase
    .from('posts')
    .select('price, seller_id, status')
    .eq('seller_id', user.id)

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()

  const totalSellers = new Set(posts?.map(p => p.seller_id)).size
  const verdient = allPosts
    ?.filter(p => p.status === 'sold')
    .reduce((sum, p) => sum + p.price, 0) || 0

  return (
    <>
      <Navbar username={profile?.display_name || profile?.username} />
      <main style={{ background: '#f7f5f0', minHeight: '100vh' }}>
        <div className="hero-padding" style={{
          background: '#1a3a6e',
          backgroundImage: 'url(https://www.lfs-koeln.de/wp-content/uploads/2023/04/bienenvoelker2.jpg)',
          backgroundSize: 'cover', backgroundPosition: 'center',
          padding: '44px 24px', position: 'relative', overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(10,25,60,0.92) 40%, rgba(10,25,60,0.6))' }} />
          <div style={{ position: 'relative', zIndex: 1, maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(240,192,64,0.15)', border: '1px solid rgba(240,192,64,0.4)', color: '#f0c040', fontSize: '11px', padding: '3px 10px', borderRadius: '4px', marginBottom: '12px', letterSpacing: '0.04em' }}>
                Erzb. Liebfrauenschule Köln
              </div>
              <h2 style={{ fontSize: '22px', fontWeight: 500, color: '#fff', marginBottom: '6px' }}>Hallo, {profile?.display_name || profile?.username}</h2>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', marginBottom: '20px', maxWidth: '400px' }}>
                Kaufe und verkaufe Artikel von Mitschülern.
              </p>
              <a href="/create" style={{ background: '#f0c040', color: '#1a3a6e', fontSize: '14px', fontWeight: 500, border: 'none', borderRadius: '4px', padding: '11px 22px', textDecoration: 'none', display: 'inline-block' }}>
                + Artikel inserieren
              </a>
            </div>
            <div className="hero-stats" style={{ display: 'flex', gap: '12px' }}>
              {[
                { num: posts?.length || 0, label: 'Angebote' },
                { num: 7, label: 'Kategorien' },
                { num: totalSellers, label: 'Verkäufer' },
                { num: `${verdient.toFixed(2)} €`, label: 'Verdient' },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', padding: '12px 16px' }}>
                  <div style={{ fontSize: '22px', fontWeight: 500, color: '#f0c040' }}>{s.num}</div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginTop: '2px' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="main-padding" style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px 20px' }}>
          <PostGrid posts={posts || []} currentUserId={user.id} />
        </div>
      </main>
      <Footer />
    </>
  )
}