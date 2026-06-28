import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import CategoryIcon from './CategoryIcon'

const categoryBg: Record<string, string> = {
  calculator: '#edf2ff',
  lfs_shirt: '#fdf0f7',
  clothing: '#fdf0f7',
  notebook: '#f0fdf4',
  lecture: '#f0fdf4',
  supplies: '#fdf8f0',
  other: '#f7f5f0'
}

export default async function SimilarPosts({ postId, category }: { postId: string, category: string }) {
  const supabase = await createClient()

  const { data: posts } = await supabase
    .from('posts')
    .select('*, profiles(username, display_name)')
    .eq('category', category)
    .eq('status', 'active')
    .is('deleted_at', null)
    .neq('id', postId)
    .limit(4)

  if (!posts || posts.length === 0) return null

  return (
    <div style={{ marginTop: '32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <p style={{ fontSize: '13px', fontWeight: 500, color: '#1a3a6e', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Ähnliche Artikel
        </p>
        <div style={{ flex: 1, height: '1px', background: '#e0dcd4' }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '10px' }}>
        {posts.map((post, i) => (
          <Link key={post.id} href={`/post/${post.id}`} className="post-card-modern"
            style={{ animationDelay: `${i * 60}ms`, textDecoration: 'none', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden', display: 'block' }}>
            <div className="post-image-modern" style={{ aspectRatio: '4/3', background: categoryBg[post.category] || '#f7f5f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {post.image_url
                ? <img src={post.image_url} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <CategoryIcon category={post.category} size={28} color="#b8c4d4" />
              }
            </div>
            <div style={{ padding: '10px 12px' }}>
              <p style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{post.title}</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px', gap: '6px' }}>
                {post.price === 0
                  ? <span style={{ fontSize: '10px', fontWeight: 600, color: '#1a6e3a', background: '#f0fdf4', padding: '3px 7px', borderRadius: '4px', whiteSpace: 'nowrap', flexShrink: 0 }}>🎁 Verschenken</span>
                  : <span style={{ fontSize: '14px', fontWeight: 500, color: '#1a3a6e', flexShrink: 0 }}>{post.price.toFixed(2)} €</span>
                }
                <span style={{ fontSize: '10px', color: 'var(--text-faint)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.profiles?.display_name || post.profiles?.username}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}