'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

function groupByReported(reports: any[]) {
  const groups = new Map<string, any[]>()
  reports.forEach(r => {
    const key = r.reported_id
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(r)
  })
  return Array.from(groups.values()).sort((a, b) => b.length - a.length)
}

export default function AdminUserReports({ reports, isOwner, currentUserId }: { reports: any[], isOwner?: boolean, currentUserId?: string }) {
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
      .from('user_reports')
      .update({ resolved: true, resolved_at: new Date().toISOString(), status, admin_note: note })
      .in('id', ids)

    if (!error) {
      const reportedName = group[0]?.reported?.display_name || group[0]?.reported?.username || 'einem Nutzer'
      const statusText = status === 'resolved' ? 'angenommen' : 'abgelehnt'
      const reporterIds = Array.from(new Set(group.map(r => r.reporter_id)))
      await Promise.all(reporterIds.map(reporterId =>
        supabase.from('notifications').insert({
          user_id: reporterId,
          type: 'report',
          message: `Deine Meldung gegen ${reportedName} wurde ${statusText}.${note ? ` Begründung: ${note}` : ''}`,
          link: '/dashboard'
        })
      ))
      setList(prev => prev.filter(r => !ids.includes(r.id)))
      router.refresh()
    }
    setBusyId(null)
  }

  async function warnUser(userId: string) {
    setBusyId(userId)
    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'warning',
      message: warnText.trim() ? `Verwarnung von einem Admin: ${warnText.trim()}` : 'Du wurdest von einem Admin verwarnt. Bitte halte dich an die Regeln.',
      link: '/dashboard'
    })
    setWarnTarget(null)
    setWarnText('')
    setBusyId(null)
  }

  async function suspendUser(userId: string) {
    setBusyId(userId)
    await supabase.from('profiles').update({
      suspended: true, suspended_at: new Date().toISOString(), suspended_reason: warnText.trim() || null
    }).eq('id', userId)
    setWarnTarget(null)
    setWarnText('')
    setBusyId(null)
    router.refresh()
  }

  if (list.length === 0) return null

  const groups = groupByReported(list)

  return (
    <div style={{ background: 'var(--state-danger-bg)', border: '1px solid var(--state-danger-border)', borderRadius: '10px', marginBottom: '20px', overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--state-danger-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--state-danger)', margin: 0 }}>Gemeldete Nutzer</p>
        <span style={{ fontSize: '12px', color: 'var(--state-danger)', background: 'var(--state-danger-bg)', padding: '2px 8px', borderRadius: '3px' }}>{list.length} Meldungen · {groups.length} Nutzer</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '560px', overflowY: 'auto' }}>
        {groups.map(group => {
          const first = group[0]
          const groupKey = first.reported_id
          const reportedName = first.reported?.display_name || first.reported?.username

          return (
            <div key={groupKey} style={{ padding: '14px 20px', borderBottom: '1px solid var(--state-danger-bg)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '11px', background: 'var(--state-danger-bg)', color: 'var(--state-danger)', padding: '2px 8px', borderRadius: '3px', fontWeight: 500 }}>
                      {group.length > 1 ? `${group.length}x gemeldet` : 'Nutzer-Meldung'}
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '6px' }}>
                    Gemeldet: <strong>{reportedName}</strong>
                    <span style={{ color: 'var(--text-faint)', fontSize: '11px' }}> (@{first.reported?.username})</span>
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {group.map((r: any) => (
                      <p key={r.id} style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
                        Von <strong>{r.reporter?.display_name || r.reporter?.username}</strong>
                        <span style={{ color: 'var(--text-faint)' }}> (@{r.reporter?.username}) – </span>
                        <span style={{ color: 'var(--state-danger)' }}>{r.reason}</span>
                        <span style={{ color: 'var(--text-faint)' }}> · {new Date(r.created_at).toLocaleDateString('de-DE')} {new Date(r.created_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</span>
                      </p>
                    ))}
                  </div>
                </div>
              </div>

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
                    style={{ fontSize: '12px', color: 'var(--state-success)', background: 'var(--state-success-bg)', border: '1px solid var(--state-success-border)', borderRadius: '4px', padding: '6px 12px', cursor: 'pointer', opacity: busyId === groupKey ? 0.6 : 1 }}>
                    {busyId === groupKey ? 'Wird gespeichert...' : 'Annehmen'}
                  </button>
                  <button onClick={() => resolveGroup(group, 'rejected')} disabled={busyId === groupKey}
                    style={{ fontSize: '12px', color: 'var(--text-secondary)', background: 'var(--bg-page)', border: '1px solid var(--border-input)', borderRadius: '4px', padding: '6px 12px', cursor: 'pointer', opacity: busyId === groupKey ? 0.6 : 1 }}>
                    Ablehnen
                  </button>

                  {isOwner && groupKey !== currentUserId && (
                    warnTarget === groupKey ? (
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <input type="text" value={warnText} onChange={e => setWarnText(e.target.value)}
                          placeholder="Grund (optional)"
                          style={{ fontSize: '12px', padding: '5px 8px', border: '1px solid var(--border-input)', borderRadius: '4px', width: '140px' }} />
                        <button onClick={() => warnUser(groupKey)} disabled={busyId === groupKey}
                          style={{ fontSize: '12px', color: 'var(--state-warning)', background: 'var(--state-warning-bg)', border: '1px solid var(--state-warning-border)', borderRadius: '4px', padding: '6px 10px', cursor: 'pointer' }}>
                          Verwarnen
                        </button>
                        <button onClick={() => suspendUser(groupKey)} disabled={busyId === groupKey}
                          style={{ fontSize: '12px', color: 'var(--text-on-dark)', background: 'var(--state-danger)', border: 'none', borderRadius: '4px', padding: '6px 10px', cursor: 'pointer' }}>
                          Sperren
                        </button>
                        <button onClick={() => { setWarnTarget(null); setWarnText('') }}
                          style={{ fontSize: '12px', color: 'var(--text-secondary)', background: 'none', border: '1px solid var(--border-input)', borderRadius: '4px', padding: '6px 8px', cursor: 'pointer' }}>
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setWarnTarget(groupKey)}
                        style={{ fontSize: '12px', color: 'var(--state-warning)', background: 'var(--state-warning-bg)', border: '1px solid var(--state-warning-border)', borderRadius: '4px', padding: '6px 12px', cursor: 'pointer' }}>
                        Verwarnen/Sperren
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
