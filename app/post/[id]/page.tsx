import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import DeleteButton from '@/components/DeleteButton'
import ReportButton from '@/components/ReportButton'
import ImageGallery from '@/components/ImageGallery'
import SimilarPosts from '@/components/SimilarPosts'
import Footer from '@/components/Footer'

const categoryLabel: Record<string, string> = {
  calculator: 'Taschenrechner',
  lfs_shirt: 'LFS Sportshirt',
  clothing: 'Klamotten',
  notebook: 'Schulhefte',
  lecture: 'Lektüren',
  supplies: 'Schulzubehör',
  other: 'Sonstiges'
}
const categoryColor: Record<string, string> = {
  calculator: 'background:#e8eef8;color:#1a3a6e',
  lfs_shirt: 'background:#fce8f3;color:#a0336e',
  clothing: 'background:#fce8f3;color:#a0336e',
  notebook: 'background:#e8f3e8;color:#1a6e3a',
  lecture: 'background:#e8f3e8;color:#1a6e3a',
  supplies: 'background:#f3f0e8;color:#6e4e1a',
  other: 'background:#f0f0f0;color:#666'
}
const categoryBg: Record<string, string> = {
  calculator: '#edf2ff',
  lfs_shirt: '#fdf0f7',
  clothing: '#fdf0f7',
  notebook: '#f0fdf4',
  lecture: '#f0fdf4',
  supplies: '#fdf8f0',
  other: '#f7f5f0'
}
const categoryEmoji: Record<string, string> = {
  calculator: '🔢',
  lfs_shirt: '👕',
  clothing: '👗',
  notebook: '📓',
  lecture: '📖',
  supplies: '✏️',
  other: '📦'
}
const extrasLabel: Record<string, string> = {
  akkuKap: 'Akkukapazität',
  zustand: 'Zustand',
  gravur: 'Gravur',
  calcCase: 'Case',
  zubehoer: 'Zubehör',
  kaufjahr: 'Kaufjahr',
  geschlecht: 'Geschlecht',
  groesse: 'Größe',
  shirtZustand: 'Zustand',
  kleidungTyp: 'Art',
  kleidungGroesse: 'Größe',
  kleidungZustand: 'Zustand',
  kleidungFarbe: 'Farbe',
  heftFach: 'Fach',
  heftZustand: 'Zustand',
  heftBeschrieben: 'Beschrieben',
  lektuereTitel: 'Buchtitel',
  lektuereFach: 'Fach',
  lektuerenZustand: 'Zustand',
  lektuereBeschrieben: 'Markiert',
  zubehoerTyp: 'Art',
  zubehoerZustand: 'Zustand'
}

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: post } = await supabase
    .from('posts').select('*, profiles(id, username, display_name)').eq('id', id).single()
  if (!post) redirect('/dashboard')

  const { data: extraImages } = await supabase
    .from('post_images').select('*').eq('post_id', id).order('position')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()

  const isOwn = post.seller_id === user.id
  const sellerDisplayName = post.profiles?.display_name || post.profiles?.username
  const extras = post.extras ? JSON.parse(post.extras) : {}
  const extrasEntries = Object.entries(extras).filter(([_, v]) => v)

  const extraUrls = extraImages?.map(i => i.url) || []
  const allImages = extraUrls.length > 0
    ? extraUrls
    : post.image_url ? [post.image_url] : []

  const catStyle = Object.fromEntries(
    (categoryColor[post.category] || 'background:#f0f0f0;color:#666').split(';').filter(Boolean).map(s => s.split(':'))
  )

  return (
    <>
      <Navbar username={profile?.display_name || profile?.username} />
      <main style={{ background: '#f7f5f0', minHeight: '100vh', padding: '16px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <Link href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#1a3a6e', textDecoration: 'none', marginBottom: '16px' }}>
            ← Zurück
          </Link>

          <div className="detail-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <ImageGallery images={allImages} fallbackBg={categoryBg[post.category]} fallbackEmoji={categoryEmoji[post.category]} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <span style={{ alignSelf: 'flex-start', fontSize: '11px', fontWeight: 500, padding: '4px 10px', borderRadius: '3px', ...catStyle }}>
                {categoryLabel[post.category]}
              </span>
              <h1 style={{ fontSize: '22px', fontWeight: 500, color: '#1a2040', lineHeight: 1.2 }}>{post.title}</h1>
              <p style={{ fontSize: '28px', fontWeight: 500, color: '#1a3a6e' }}>{post.price.toFixed(2)} €</p>
              <hr style={{ border: 'none', borderTop: '1px solid #e0dcd4' }} />
              {post.description && (
                <p style={{ fontSize: '14px', color: '#666', lineHeight: 1.6 }}>{post.description}</p>
              )}
              {extrasEntries.length > 0 && (
                <div style={{ background: '#eef2f8', border: '1px solid #c8d4e8', borderRadius: '8px', padding: '14px 16px' }}>
                  <p style={{ fontSize: '11px', fontWeight: 500, color: '#1a3a6e', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>Details</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {extrasEntries.map(([key, value]) => (
                      <div key={key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                        <span style={{ color: '#888' }}>{extrasLabel[key] || key}</span>
                        <span style={{ color: '#1a2040', fontWeight: 500 }}>{value as string}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <hr style={{ border: 'none', borderTop: '1px solid #e0dcd4' }} />
              <div style={{ background: '#fff', border: '1px solid #e0dcd4', borderRadius: '8px', padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#eef2f8', border: '1px solid #c8d4e8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 500, color: '#1a3a6e', flexShrink: 0 }}>
                    {sellerDisplayName?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 500, color: '#1a2040' }}>{sellerDisplayName}</p>
                    <p style={{ fontSize: '11px', color: '#aaa' }}>Verkäufer</p>
                  </div>
                </div>
                {!isOwn && (
                  <Link href={`/chat/${post.profiles?.id}?post=${post.id}`}
                    style={{ background: '#1a3a6e', color: '#fff', fontSize: '13px', fontWeight: 500, borderRadius: '4px', padding: '9px 16px', textDecoration: 'none', whiteSpace: 'nowrap' }}>
                    Nachricht
                  </Link>
                )}
                {isOwn && (
                  <span style={{ fontSize: '12px', color: '#aaa', background: '#f7f5f0', padding: '6px 10px', borderRadius: '4px' }}>
                    Dein Inserat
                  </span>
                )}
              </div>
              {!isOwn && <ReportButton postId={id} />}
              {isOwn && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Link href={`/post/${id}/edit`}
                    style={{ flex: 1, background: '#eef2f8', border: '1px solid #c8d4e8', color: '#1a3a6e', fontSize: '13px', fontWeight: 500, borderRadius: '6px', padding: '10px', textDecoration: 'none', textAlign: 'center' }}>
                    Bearbeiten
                  </Link>
                  <DeleteButton postId={id} />
                </div>
              )}
              {isOwn && post.status === 'active' && (
                <Link href={`/post/${id}/sold`}
                  style={{ display: 'block', textAlign: 'center', background: '#f0fdf4', border: '1px solid #86efac', color: '#1a6e3a', fontSize: '13px', fontWeight: 500, borderRadius: '6px', padding: '10px', textDecoration: 'none' }}>
                  Als verkauft markieren
                </Link>
              )}
            </div>
          </div>
          <SimilarPosts postId={id} category={post.category} />
        </div>
      </main>
      <Footer />
    </>
  )
}