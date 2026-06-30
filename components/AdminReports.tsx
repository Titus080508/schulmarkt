'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import DeleteButton from '@/components/DeleteButton'

function groupByPost(reports: any[]) {
  const groups = new Map<string, any[]>()
  reports.forEach(r => {
    const key = r.post_id
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(r)
  })
  return Array.from(groups.values()).sort((a, b) => b.length - a.length)
}

export default function AdminReports({ reports, title, showResolve, isOwner, currentUserId }: { reports: any[], title: string, showResolve: boolean, isOwner?: boolean, currentUserId?: string }) {
  const [list, setList] = useState(reports)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({})
  const [warnTarget, setWarnTarget] = useState<string | null>(null)
  const [warnText, setWarnText] = useState('')
  const supabase = createClient()
  const router = useRouter()

  async function resolveGroup(group: any[], status: 'resolved' | 'rejected') {
    const ids = group.map(r => r.id)
    const groupKey = ids[0]
    setBusyId(groupKey)
    const note = noteDraft[groupKey] || null
    const { error } = await supabase
      .from('reports')
      .update({ resolved: true, resolved_at: new Date().toISOString(), status, admin_note: note })
      .in('id', ids)

    if (!error) {
      const postTitle = group[0]?.post?.title || 'einem Beitrag'
      const statusText = status === 'resolved' ? 'angenommen' : 'abgelehnt'
      const reporterIds = Array.from(new Set(group.map(r => r.reporter_id)))
      await Promise.all(reporterIds.map(reporterId =>
        supabase.from('notifications').insert({
          user_id: reporterId,
          type: 'report',
          message: `Deine Meldung zu „${postTitle}" wurde ${statusText}.${note ? ` Begründung: ${note}` : ''}`,
          link: `/post/${group[0].post_id}`
        })
      ))
      setList(prev => prev.filter(r => !ids.includes(r.id)))
      router.refresh()
    }
    setBusyId(null)
  }

  async function warnSeller(sellerId: string) {
    setBusyId(sellerId)
    await supabase.from('notifications').insert({
      user_id: sellerId,
      type: 'warning',
      message: warnText.trim() ? `Verwarnung von einem Admin: ${warnText.trim()}` : 'Du wurdest von einem Admin verwarnt. Bitte halte dich an die Regeln.',
      link: '/dashboard'
    })
    setWarnTarget(null)
    setWarnText('')
    setBusyId(null)
  }

  async function suspendSeller(sellerId: string) {
    setBusyId(sellerId)
    await supabase.from('profiles').update({
      suspended: true, suspended_at: new Date().toISOString(), suspended_reason: warnText.trim() || null
    }).eq('id', sellerId)
    setWarnTarget(null)
    setWarnText('')
    setBusyId(null)
    router.refresh()
  }

  if (list.length === 0) return null

  const groups = groupByPost(list)

  return (
    <div style={{ background: '#fff8f8', border: '1px solid #fecaca', borderRadius: '10px', marginBottom: '20px', overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #fecaca', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <p style={{ fontSize: '14px', fontWeight: 500, color: '#b91c1c', margin: 0 }}>{title}</p>
        <span style={{ fontSize: '12px', color: '#b91c1c', background: '#fee2e2', padding: '2px 8px', borderRadius: '3px' }}>{list.length} Meldungen · {groups.length} Beiträge</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '560px', overflowY: 'auto' }}>
        {groups.map(group => {
          const first = group[0]
          const groupKey = first.post_id
          const sellerId = first.post?.profiles?.id
          const sellerName = first.post?.profiles?.display_name || first.post?.profiles?.username

          return (
            <div key={groupKey} style={{ padding: '14px 20px', borderBottom: '1px solid #fee2e2' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '11px', background: '#fee2e2', color: '#b91c1c', padding: '2px 8px', borderRadius: '3px', fontWeight: 500 }}>
                      {group.length > 1 ? `${group.length}x gemeldet` : 'Meldung'}
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '6px' }}>
                    Post: <Link href={`/post/${first.post_id}`} style={{ color: '#1a3a6e', textDecoration: 'none' }}>{first.post?.title}</Link>
                    {sellerName && <span style={{ color: 'var(--text-faint)', fontSize: '11px' }}> · von {sellerName}</span>}
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {group.map((r: any) => (
                      <p key={r.id} style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
                        <strong>{r.reporter?.display_name || r.reporter?.username}</strong>
                        <span style={{ color: 'var(--text-faint)' }}> (@{r.reporter?.username}) – </span>
                        <span style={{ color: '#b91c1c' }}>{r.reason}</span>
                        <span style={{ color: 'var(--text-faint)' }}> · {new Date(r.created_at).toLocaleDateString('de-DE')} {new Date(r.created_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</span>
                      </p>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0, flexWrap: 'wrap' }}>
                  <Link href={`/post/${first.post_id}`}
                    style={{ fontSize: '12px', color: '#1a3a6e', textDecoration: 'none', background: '#eef2f8', border: '1px solid #c8d4e8', borderRadius: '4px', padding: '6px 12px' }}>
                    Ansehen
                  </Link>
                  <DeleteButton postId={first.post_id} />
                </div>
              </div>

              {showResolve && (
                <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <textarea
                    value={noteDraft[groupKey] || ''}
                    onChange={e => setNoteDraft(prev => ({ ...prev, [groupKey]: e.target.value }))}
                    placeholder="Admin-Notiz (optional)..."
                    rows={1}
                    style={{ width: '100%', fontSize: '12px', padding: '6px 10px', border: '1px solid var(--border-input)', borderRadius: '4px', boxSizing: 'border-box', resize: 'vertical' }}
                  />
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button onClick={() => resolveGroup(group, 'resolved')} disabled={busyId === groupKey}
                      style={{ fontSize: '12px', color: '#1a6e3a', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '4px', padding: '6px 12px', cursor: 'pointer', opacity: busyId === groupKey ? 0.6 : 1 }}>
                      {busyId === groupKey ? 'Wird gespeichert...' : 'Annehmen'}
                    </button>
                    <button onClick={() => resolveGroup(group, 'rejected')} disabled={busyId === groupKey}
                      style={{ fontSize: '12px', color: 'var(--text-secondary)', background: 'var(--bg-page)', border: '1px solid var(--border-input)', borderRadius: '4px', padding: '6px 12px', cursor: 'pointer', opacity: busyId === groupKey ? 0.6 : 1 }}>
                      Ablehnen
                    </button>

                    {isOwner && sellerId && sellerId !== currentUserId && (
                      warnTarget === sellerId ? (
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                          <input type="text" value={warnText} onChange={e => setWarnText(e.target.value)}
                            placeholder="Grund (optional)"
                            style={{ fontSize: '12px', padding: '5px 8px', border: '1px solid var(--border-input)', borderRadius: '4px', width: '140px' }} />
                          <button onClick={() => warnSeller(sellerId)} disabled={busyId === sellerId}
                            style={{ fontSize: '12px', color: '#92400e', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '4px', padding: '6px 10px', cursor: 'pointer' }}>
                            Verwarnen
                          </button>
                          <button onClick={() => suspendSeller(sellerId)} disabled={busyId === sellerId}
                            style={{ fontSize: '12px', color: '#fff', background: '#b91c1c', border: 'none', borderRadius: '4px', padding: '6px 10px', cursor: 'pointer' }}>
                            Sperren
                          </button>
                          <button onClick={() => { setWarnTarget(null); setWarnText('') }}
                            style={{ fontSize: '12px', color: 'var(--text-secondary)', background: 'none', border: '1px solid var(--border-input)', borderRadius: '4px', padding: '6px 8px', cursor: 'pointer' }}>
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setWarnTarget(sellerId)}
                          style={{ fontSize: '12px', color: '#92400e', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '4px', padding: '6px 12px', cursor: 'pointer' }}>
                          Verkäufer verwarnen/sperren
                        </button>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
