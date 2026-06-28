'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import DeleteButton from './DeleteButton'

const categoryLabel: Record<string, string> = {
  calculator: 'Taschenrechner', lfs_shirt: 'LFS Sportshirt', clothing: 'Klamotten',
  notebook: 'Schulhefte', lecture: 'Lektüren', supplies: 'Schulzubehör', other: 'Sonstiges'
}

export default function AdminPostsTable({ posts }: { posts: any[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const allSelected = posts.length > 0 && selected.size === posts.length

  function toggleOne(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(posts.map(p => p.id)))
  }

  async function bulkDelete() {
    if (selected.size === 0) return
    if (!confirm(`${selected.size} Inserat(e) wirklich löschen? (48h wiederherstellbar)`)) return
    setBusy(true)
    await supabase.from('posts').update({ deleted_at: new Date().toISOString() }).in('id', Array.from(selected))
    setSelected(new Set())
    setBusy(false)
    router.refresh()
  }

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', marginBottom: '20px', overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <p style={{ fontSize: '14px', fontWeight: 500, color: '#1a3a6e', margin: 0 }}>Alle Inserate</p>
        {selected.size > 0 ? (
          <div className="fade-in-up" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{selected.size} ausgewählt</span>
            <button onClick={bulkDelete} disabled={busy} className="btn-modern"
              style={{ fontSize: '12px', fontWeight: 600, color: '#fff', background: '#b91c1c', border: 'none', borderRadius: '4px', padding: '6px 12px', cursor: 'pointer' }}>
              {busy ? 'Wird gelöscht...' : 'Löschen'}
            </button>
            <button onClick={() => setSelected(new Set())}
              style={{ fontSize: '12px', color: 'var(--text-muted)', background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer' }}>
              Abbrechen
            </button>
          </div>
        ) : (
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{posts.length} gesamt</span>
        )}
      </div>
      <div style={{ maxHeight: '480px', overflowY: 'auto', overflowX: 'auto' }}>
        <table style={{ width: '100%', minWidth: '680px', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ padding: '10px 12px', background: 'var(--bg-page)', position: 'sticky', top: 0, zIndex: 1, width: '36px' }}>
                <input type="checkbox" checked={allSelected} onChange={toggleAll} style={{ width: '15px', height: '15px', cursor: 'pointer' }} />
              </th>
              {['Titel', 'Kategorie', 'Preis', 'Verkäufer', 'Status', 'Aktionen'].map(h => (
                <th key={h} style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.06em', background: 'var(--bg-page)', position: 'sticky', top: 0, zIndex: 1 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {posts.map(post => (
              <tr key={post.id} className="row-modern" style={{ borderTop: '1px solid var(--border-light)', background: selected.has(post.id) ? 'var(--bg-page)' : 'transparent' }}>
                <td style={{ padding: '12px' }}>
                  <input type="checkbox" checked={selected.has(post.id)} onChange={() => toggleOne(post.id)} style={{ width: '15px', height: '15px', cursor: 'pointer' }} />
                </td>
                <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.title}</td>
                <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-secondary)' }}>{categoryLabel[post.category]}</td>
                <td style={{ padding: '12px 16px', fontSize: '13px', color: post.price === 0 ? '#1a6e3a' : '#1a3a6e', fontWeight: 500 }}>{post.price === 0 ? 'Verschenkt' : `${post.price.toFixed(2)} €`}</td>
                <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-secondary)' }}>{post.profiles?.display_name || post.profiles?.username}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 500, padding: '3px 8px', borderRadius: '3px', background: post.status === 'active' ? '#f0fdf4' : '#f7f5f0', color: post.status === 'active' ? '#1a6e3a' : '#888' }}>
                    {post.status === 'active' ? 'Aktiv' : 'Verkauft'}
                  </span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <Link href={`/post/${post.id}`} style={{ fontSize: '12px', color: '#1a3a6e', textDecoration: 'none', background: '#eef2f8', border: '1px solid #c8d4e8', borderRadius: '4px', padding: '4px 10px' }}>Ansehen</Link>
                    <Link href={`/post/${post.id}/edit`} style={{ fontSize: '12px', color: 'var(--text-secondary)', textDecoration: 'none', background: 'var(--bg-page)', border: '1px solid var(--border-input)', borderRadius: '4px', padding: '4px 10px' }}>Bearbeiten</Link>
                    <DeleteButton postId={post.id} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
