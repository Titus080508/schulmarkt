'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

const roleLabel: Record<string, string> = { owner: 'Owner', moderator: 'Moderator', user: 'Nutzer' }
const roleColor: Record<string, string> = { owner: '#b91c1c', moderator: '#1a3a6e', user: '#888' }

export default function AdminUsers({ users, isOwner, currentUserId }: { users: any[], isOwner: boolean, currentUserId: string }) {
  const [search, setSearch] = useState('')
  const [list, setList] = useState(users)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [suspendTarget, setSuspendTarget] = useState<string | null>(null)
  const [suspendReason, setSuspendReason] = useState('')
  const supabase = createClient()
  const router = useRouter()

  const filtered = list.filter(u =>
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.display_name?.toLowerCase().includes(search.toLowerCase())
  )

  async function changeRole(userId: string, role: string) {
    setBusyId(userId)
    const { error } = await supabase.from('profiles').update({ role, is_admin: role !== 'user' }).eq('id', userId)
    if (!error) {
      setList(prev => prev.map(u => u.id === userId ? { ...u, role, is_admin: role !== 'user' } : u))
      router.refresh()
    }
    setBusyId(null)
  }

  async function suspend(userId: string) {
    setBusyId(userId)
    const { error } = await supabase.from('profiles').update({
      suspended: true, suspended_at: new Date().toISOString(), suspended_reason: suspendReason || null
    }).eq('id', userId)
    if (!error) {
      setList(prev => prev.map(u => u.id === userId ? { ...u, suspended: true } : u))
      setSuspendTarget(null)
      setSuspendReason('')
      router.refresh()
    }
    setBusyId(null)
  }

  async function unsuspend(userId: string) {
    setBusyId(userId)
    const { error } = await supabase.from('profiles').update({ suspended: false, suspended_reason: null }).eq('id', userId)
    if (!error) {
      setList(prev => prev.map(u => u.id === userId ? { ...u, suspended: false } : u))
      router.refresh()
    }
    setBusyId(null)
  }

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', overflow: 'hidden', marginBottom: '20px' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <p style={{ fontSize: '14px', fontWeight: 500, color: '#1a3a6e' }}>Alle Nutzer</p>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Nutzer suchen..."
          style={{ background: 'var(--bg-page)', border: '1px solid var(--border-input)', borderRadius: '6px', padding: '7px 12px', fontSize: '13px', color: 'var(--text-primary)', outline: 'none', width: '100%', maxWidth: '220px', boxSizing: 'border-box' }}
        />
      </div>
      <div style={{ maxHeight: '480px', overflowY: 'auto', overflowX: 'auto' }}>
      <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {['Anzeigename', 'Benutzername', 'Registriert am', 'Rolle', 'Inserate', ...(isOwner ? ['Aktionen'] : [])].map(h => (
              <th key={h} style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.06em', background: 'var(--bg-page)', position: 'sticky', top: 0, zIndex: 1 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 && (
            <tr>
              <td colSpan={isOwner ? 6 : 5} style={{ padding: '20px', textAlign: 'center', fontSize: '13px', color: 'var(--text-faint)' }}>Kein Nutzer gefunden</td>
            </tr>
          )}
          {filtered.map(u => (
            <tr key={u.id} style={{ borderTop: '1px solid var(--border-light)', opacity: u.suspended ? 0.6 : 1 }}>
              <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500 }}>
                {u.display_name || <span style={{ color: 'var(--text-faint)', fontStyle: 'italic' }}>Nicht gesetzt</span>}
                {u.suspended && <span style={{ marginLeft: '6px', fontSize: '10px', background: '#b91c1c', color: '#fff', padding: '2px 6px', borderRadius: '3px' }}>Gesperrt</span>}
              </td>
              <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-secondary)' }}>@{u.username}</td>
              <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-muted)' }}>
                {new Date(u.created_at).toLocaleDateString('de-DE')}
              </td>
              <td style={{ padding: '12px 16px' }}>
                {isOwner && u.id !== currentUserId ? (
                  <select value={u.role || 'user'} disabled={busyId === u.id}
                    onChange={e => changeRole(u.id, e.target.value)}
                    style={{ fontSize: '12px', color: roleColor[u.role || 'user'], fontWeight: 500, background: 'var(--bg-page)', border: '1px solid var(--border-input)', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer' }}>
                    <option value="user">Nutzer</option>
                    <option value="moderator">Moderator</option>
                    <option value="owner">Owner</option>
                  </select>
                ) : (
                  <span style={{ fontSize: '11px', fontWeight: 500, color: roleColor[u.role || 'user'], background: 'var(--bg-page)', padding: '3px 8px', borderRadius: '3px' }}>
                    {roleLabel[u.role || 'user']}
                  </span>
                )}
              </td>
              <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                {u.post_count || 0}
              </td>
              {isOwner && (
                <td style={{ padding: '12px 16px' }}>
                  {u.id === currentUserId ? (
                    <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>—</span>
                  ) : u.suspended ? (
                    <button onClick={() => unsuspend(u.id)} disabled={busyId === u.id}
                      style={{ fontSize: '12px', color: '#1a6e3a', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '4px', padding: '5px 10px', cursor: 'pointer' }}>
                      Entsperren
                    </button>
                  ) : suspendTarget === u.id ? (
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <input type="text" value={suspendReason} onChange={e => setSuspendReason(e.target.value)}
                        placeholder="Grund (optional)"
                        style={{ fontSize: '12px', padding: '5px 8px', border: '1px solid var(--border-input)', borderRadius: '4px', width: '120px' }} />
                      <button onClick={() => suspend(u.id)} disabled={busyId === u.id}
                        style={{ fontSize: '12px', color: '#fff', background: '#b91c1c', border: 'none', borderRadius: '4px', padding: '5px 10px', cursor: 'pointer' }}>
                        Sperren
                      </button>
                      <button onClick={() => { setSuspendTarget(null); setSuspendReason('') }}
                        style={{ fontSize: '12px', color: 'var(--text-secondary)', background: 'var(--bg-page)', border: '1px solid var(--border-input)', borderRadius: '4px', padding: '5px 8px', cursor: 'pointer' }}>
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setSuspendTarget(u.id)}
                      style={{ fontSize: '12px', color: '#b91c1c', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '4px', padding: '5px 10px', cursor: 'pointer' }}>
                      Sperren
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  )
}
