'use client'
import { useState } from 'react'
import Link from 'next/link'

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

export default function PostGrid({ posts, currentUserId }: { posts: any[], currentUserId: string }) {
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState('newest')
  const [search, setSearch] = useState('')
  const [maxPrice, setMaxPrice] = useState('')

  let filtered = posts
  if (filter !== 'all') filtered = filtered.filter(p => p.category === filter)
  if (search) filtered = filtered.filter(p => p.title.toLowerCase().includes(search.toLowerCase()))
  if (maxPrice) filtered = filtered.filter(p => p.price <= parseFloat(maxPrice))
  if (sort === 'price_asc')  filtered = [...filtered].sort((a, b) => a.price - b.price)
  if (sort === 'price_desc') filtered = [...filtered].sort((a, b) => b.price - a.price)

  return (
    <>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Artikel suchen..."
          style={{ flex: 1, minWidth: '140px', background: '#fff', border: '1px solid #ddd', borderRadius: '6px', padding: '9px 14px', fontSize: '14px', color: '#1a2040', outline: 'none' }} />
        <input type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)}
          placeholder="Max. €"
          style={{ width: '90px', background: '#fff', border: '1px solid #ddd', borderRadius: '6px', padding: '9px 10px', fontSize: '14px', color: '#1a2040', outline: 'none' }} />
        <select value={sort} onChange={e => setSort(e.target.value)}
          style={{ background: '#fff', border: '1px solid #ddd', borderRadius: '6px', padding: '9px 10px', fontSize: '13px', color: '#444', outline: 'none', cursor: 'pointer' }}>
          <option value="newest">Neueste</option>
          <option value="price_asc">Preis ↑</option>
          <option value="price_desc">Preis ↓</option>
        </select>
      </div>

      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {['all', 'calculator', 'lfs_shirt', 'clothing', 'notebook', 'lecture', 'supplies', 'other'].map(cat => (
          <button key={cat} onClick={() => setFilter(cat)}
            style={{
              background: filter === cat ? '#1a3a6e' : '#fff',
              border: `1px solid ${filter === cat ? '#1a3a6e' : '#ddd'}`,
              color: filter === cat ? '#fff' : '#666',
              fontSize: '12px', padding: '6px 12px',
              borderRadius: '4px', cursor: 'pointer'
            }}>
            {cat === 'all' ? 'Alle' : categoryLabel[cat]}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <p style={{ fontSize: '14px', color: '#aaa' }}>Keine Inserate gefunden.</p>
        </div>
      )}

      <div className="grid-mobile" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
        {filtered.map(post => {
          const catStyle = Object.fromEntries(
            (categoryColor[post.category] || 'background:#f0f0f0;color:#666').split(';').filter(Boolean).map(s => s.split(':'))
          )
          return (
            <Link key={post.id} href={`/post/${post.id}`}
              style={{ textDecoration: 'none', background: '#fff', border: '1px solid #e0dcd4', borderRadius: '8px', overflow: 'hidden', display: 'block' }}>
              <div style={{ aspectRatio: '4/3', background: categoryBg[post.category] || '#f7f5f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', position: 'relative' }}>
                {post.image_url
                  ? <img src={post.image_url} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : categoryEmoji[post.category]
                }
                <span style={{ position: 'absolute', top: '8px', left: '8px', fontSize: '10px', fontWeight: 500, padding: '3px 8px', borderRadius: '3px', ...catStyle }}>
                  {categoryLabel[post.category]}
                </span>
              </div>
              <div style={{ padding: '10px 12px', borderTop: '1px solid #f0ece4' }}>
                <p style={{ fontSize: '13px', fontWeight: 500, color: '#1a2040', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{post.title}</p>
                <p style={{ fontSize: '11px', color: '#aaa', marginBottom: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{post.description}</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '15px', fontWeight: 500, color: '#1a3a6e' }}>{post.price.toFixed(2)} €</span>
                  <span style={{ fontSize: '10px', color: '#bbb', background: '#f7f5f0', padding: '2px 7px', borderRadius: '3px' }}>{post.profiles?.display_name || post.profiles?.username}</span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </>
  )
}