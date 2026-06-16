import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'

const categoryBg: Record<string, string> = {
  calculator: '#edf2ff', shirt: '#fdf0f7', book: '#f0fdf4', other: '#fdf8f0'
}
const categoryEmoji: Record<string, string> = {
  calculator: '🔢', shirt: '👕', book: '📚', other: '📦'
}

export default async function SimilarPosts({ postId, category }: { postId: string, category: string }) {
  const supabase = await createClient()

  const { data: posts } = await supabase
    .from('posts')
    .select('*, profiles(username, display_name)')
    .eq('category', category)
    .eq('status', 'active')
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
        {posts.map(post => (
          <Link key={post.id} href={`/post/${post.id}`}
            style={{ textDecoration: 'none', background: '#fff', border: '1px solid #e0dcd4', borderRadius: '8px', overflow: 'hidden', display: 'block' }}>
            <div style={{ aspectRatio: '4/3', background: categoryBg[post.category] || '#f7f5f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px' }}>
              {post.image_url
                ? <img src={post.image_url} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : categoryEmoji[post.category]
              }
            </div>
            <div style={{ padding: '10px 12px' }}>
              <p style={{ fontSize: '12px', fontWeight: 500, color: '#1a2040', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{post.title}</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                <span style={{ fontSize: '14px', fontWeight: 500, color: '#1a3a6e' }}>{post.price.toFixed(2)} €</span>
                <span style={{ fontSize: '10px', color: '#bbb' }}>{post.profiles?.display_name || post.profiles?.username}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}