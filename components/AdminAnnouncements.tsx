'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function AdminAnnouncements({ announcements }: { announcements: any[] }) {
  const [list, setList] = useState(announcements)
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [pinned, setPinned] = useState(false)
  const [loading, setLoading] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()

  async function create() {
    if (!title.trim() || !message.trim()) return
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase.from('announcements').insert({
      title: title.trim(), message: message.trim(), created_by: user?.id, pinned
    }).select().single()
    if (!error && data) {
      setList(prev => [data, ...prev])
      setTitle(''); setMessage(''); setPinned(false); setOpen(false)
      router.refresh()
    }
    setLoading(false)
  }

  async function togglePinned(id: string, currentlyPinned: boolean) {
    setBusyId(id)
    const { error } = await supabase.from('announcements').update({ pinned: !currentlyPinned }).eq('id', id)
    if (!error) {
      setList(prev => prev.map(a => a.id === id ? { ...a, pinned: !currentlyPinned } : a))
      router.refresh()
    }
    setBusyId(null)
  }

  async function toggleActive(id: string, active: boolean) {
    setBusyId(id)
    const { error } = await supabase.from('announcements').update({ active: !active }).eq('id', id)
    if (!error) {
      setList(prev => prev.map(a => a.id === id ? { ...a, active: !active } : a))
      router.refresh()
    }
    setBusyId(null)
  }

  async function remove(id: string) {
    if (!confirm('Ankündigung wirklich löschen?')) return
    setBusyId(id)
    const { error } = await supabase.from('announcements').delete().eq('id', id)
    if (!error) {
      setList(prev => prev.filter(a => a.id !== id))
      router.refresh()
    }
    setBusyId(null)
  }

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', marginBottom: '20px', overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-primary)', margin: 0 }}>Ankündigungen</p>
        <button onClick={() => setOpen(!open)} className="btn-modern"
          style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-on-dark)', background: 'var(--color-primary)', border: 'none', borderRadius: '4px', padding: '6px 12px', cursor: 'pointer' }}>
          {open ? 'Schließen' : '+ Neue Ankündigung'}
        </button>
      </div>

      {open && (
        <div className="fade-in-up" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Titel"
            style={{ background: 'var(--bg-page)', border: '1px solid var(--border-input)', borderRadius: '6px', padding: '9px 12px', fontSize: '13px', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }} />
          <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3} placeholder="Nachricht für alle Nutzer..."
            style={{ background: 'var(--bg-page)', border: '1px solid var(--border-input)', borderRadius: '6px', padding: '9px 12px', fontSize: '13px', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box', resize: 'none' }} />
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <input type="checkbox" checked={pinned} onChange={e => setPinned(e.target.checked)} style={{ width: '15px', height: '15px', cursor: 'pointer' }} />
            Anpinnen (Nutzer können sie nicht wegklicken)
          </label>
          <button onClick={create} disabled={loading || !title.trim() || !message.trim()} className="btn-modern"
            style={{ alignSelf: 'flex-start', fontSize: '13px', fontWeight: 600, color: 'var(--text-on-dark)', background: 'var(--state-success)', border: 'none', borderRadius: '6px', padding: '8px 16px', cursor: 'pointer' }}>
            {loading ? 'Wird veröffentlicht...' : 'Veröffentlichen'}
          </button>
        </div>
      )}

      {list.length === 0 ? (
        <p style={{ padding: '20px', textAlign: 'center', fontSize: '13px', color: 'var(--text-faint)' }}>Noch keine Ankündigungen.</p>
      ) : (
        <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
          {list.map(a => (
            <div key={a.id} className="row-modern" style={{ padding: '12px 20px', borderTop: '1px solid var(--border-light)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', opacity: a.active ? 1 : 0.5 }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{a.title}</p>
                  <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 7px', borderRadius: '999px', background: a.active ? 'var(--state-success-bg)' : 'var(--bg-page)', color: a.active ? 'var(--state-success)' : 'var(--text-faint)' }}>
                    {a.active ? 'Aktiv' : 'Inaktiv'}
                  </span>
                  {a.pinned && (
                    <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 7px', borderRadius: '999px', background: 'var(--state-danger-bg)', color: 'var(--state-danger)' }}>
                      Angepinnt
                    </span>
                  )}
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>{a.message}</p>
                <p style={{ fontSize: '11px', color: 'var(--text-faint)', margin: '4px 0 0' }}>{new Date(a.created_at).toLocaleDateString('de-DE')}</p>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                <button onClick={() => togglePinned(a.id, a.pinned)} disabled={busyId === a.id}
                  style={{ fontSize: '12px', color: a.pinned ? 'var(--state-danger)' : 'var(--text-secondary)', background: a.pinned ? 'var(--state-danger-bg)' : 'var(--bg-page)', border: `1px solid ${a.pinned ? 'var(--state-danger-border)' : 'var(--border-input)'}`, borderRadius: '4px', padding: '5px 10px', cursor: 'pointer' }}>
                  {a.pinned ? 'Lösen' : 'Anpinnen'}
                </button>
                <button onClick={() => toggleActive(a.id, a.active)} disabled={busyId === a.id}
                  style={{ fontSize: '12px', color: a.active ? 'var(--text-secondary)' : 'var(--state-success)', background: a.active ? 'var(--bg-page)' : 'var(--state-success-bg)', border: `1px solid ${a.active ? 'var(--border-input)' : 'var(--state-success-border)'}`, borderRadius: '4px', padding: '5px 10px', cursor: 'pointer' }}>
                  {a.active ? 'Deaktivieren' : 'Aktivieren'}
                </button>
                <button onClick={() => remove(a.id)} disabled={busyId === a.id}
                  style={{ fontSize: '12px', color: 'var(--state-danger)', background: 'var(--state-danger-bg)', border: '1px solid var(--state-danger-border)', borderRadius: '4px', padding: '5px 10px', cursor: 'pointer' }}>
                  Löschen
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
