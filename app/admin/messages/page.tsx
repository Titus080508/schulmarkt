'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import Navbar from '@/components/Navbar'
import Link from 'next/link'

function formatDay(ts: string) {
  const d = new Date(ts)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Heute'
  if (d.toDateString() === yesterday.toDateString()) return 'Gestern'
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function AdminMessagesPage() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [allMessages, setAllMessages] = useState<any[]>([])
  const [conversations, setConversations] = useState<any[]>([])
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: myProfile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (myProfile?.role !== 'owner') { router.push('/admin'); return }
      setProfile(myProfile)

      const { data: msgs } = await supabase
        .from('messages')
        .select('*, sender:profiles!sender_id(id, username, display_name), receiver:profiles!receiver_id(id, username, display_name)')
        .order('created_at', { ascending: true })

      if (msgs) {
        setAllMessages(msgs)
        const groups: Record<string, any> = {}
        for (const msg of msgs) {
          const key = [msg.sender_id, msg.receiver_id].sort().join('_')
          if (!groups[key]) {
            groups[key] = {
              key,
              userA: msg.sender,
              userB: msg.receiver,
              count: 0,
              lastMsg: '',
              lastTime: msg.created_at
            }
          }
          groups[key].count++
          groups[key].lastMsg = msg.content
          groups[key].lastTime = msg.created_at
        }
        const list = Object.values(groups).sort((a: any, b: any) => new Date(b.lastTime).getTime() - new Date(a.lastTime).getTime())
        setConversations(list)
      }
      setLoading(false)
    }
    load()
  }, [])

  const myDisplayName = profile?.display_name || profile?.username

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-page)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Wird geladen...</p>
      </div>
    )
  }

  const filteredConversations = conversations.filter(c => {
    const nameA = (c.userA?.display_name || c.userA?.username || '').toLowerCase()
    const nameB = (c.userB?.display_name || c.userB?.username || '').toLowerCase()
    return nameA.includes(search.toLowerCase()) || nameB.includes(search.toLowerCase())
  })

  const selected = conversations.find(c => c.key === selectedKey)
  const threadMessages = selected ? allMessages.filter(m => [m.sender_id, m.receiver_id].sort().join('_') === selected.key) : []
  let lastDay = ''

  return (
    <div style={{ height: '100vh', background: 'var(--bg-page)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Navbar username={myDisplayName} />
      <main style={{ maxWidth: '1100px', margin: '0 auto', width: '100%', padding: '24px 20px', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
        <Link href="/admin" className="link-modern" style={{ fontSize: '13px', color: '#1a3a6e', textDecoration: 'none', marginBottom: '16px', display: 'inline-flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          ← Admin
        </Link>

        <div style={{ flex: 1, display: 'flex', border: '1px solid var(--border-color)', borderRadius: '10px', overflow: 'hidden', background: 'var(--bg-card)', minHeight: 0 }}>

          <div style={{ width: '320px', flexShrink: 0, borderRight: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', background: 'var(--bg-card)', minHeight: 0 }}>
            <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border-light)' }}>
              <p style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, marginBottom: '10px' }}>Alle Unterhaltungen</p>
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Nutzer suchen..."
                style={{ width: '100%', background: 'var(--bg-page)', border: '1px solid var(--border-input)', borderRadius: '6px', padding: '8px 12px', fontSize: '13px', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {filteredConversations.length === 0 && (
                <p style={{ textAlign: 'center', color: 'var(--text-faint)', fontSize: '13px', padding: '24px' }}>Keine Unterhaltungen gefunden.</p>
              )}
              {filteredConversations.map(conv => {
                const active = conv.key === selectedKey
                const nameA = conv.userA?.display_name || conv.userA?.username
                const nameB = conv.userB?.display_name || conv.userB?.username
                return (
                  <div key={conv.key} onClick={() => setSelectedKey(conv.key)} className="row-modern"
                    style={{ padding: '12px 20px', cursor: 'pointer', background: active ? '#f0fdf4' : 'transparent', borderLeft: active ? '3px solid #1a6e3a' : '3px solid transparent' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '6px' }}>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {nameA} ↔ {nameB}
                      </p>
                      <span style={{ fontSize: '10px', color: 'var(--text-faint)', flexShrink: 0 }}>
                        {new Date(conv.lastTime).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{conv.lastMsg}</p>
                    <p style={{ fontSize: '11px', color: 'var(--text-faint)', margin: '2px 0 0' }}>{conv.count} Nachrichten</p>
                  </div>
                )
              })}
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0 }}>
            {!selected && (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ color: 'var(--text-faint)', fontSize: '14px' }}>Wähle eine Unterhaltung aus.</p>
              </div>
            )}
            {selected && (
              <>
                <div style={{ background: 'var(--bg-card)', padding: '14px 20px', borderBottom: '1px solid var(--border-light)', flexShrink: 0 }}>
                  <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    {selected.userA?.display_name || selected.userA?.username} ↔ {selected.userB?.display_name || selected.userB?.username}
                  </p>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>Nur lesend · {threadMessages.length} Nachrichten</p>
                </div>

                <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto', minHeight: 0, background: '#fafcf8' }}>
                  {threadMessages.map(msg => {
                    const day = formatDay(msg.created_at)
                    const showDivider = day !== lastDay
                    lastDay = day
                    const isA = msg.sender_id === selected.userA?.id
                    const senderName = msg.sender?.display_name || msg.sender?.username
                    return (
                      <div key={msg.id}>
                        {showDivider && (
                          <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-faint)', margin: '14px 0' }}>{day}</p>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '70%', marginBottom: '12px', alignSelf: isA ? 'flex-start' : 'flex-end', alignItems: isA ? 'flex-start' : 'flex-end', marginLeft: isA ? 0 : 'auto' }}>
                          <span style={{ fontSize: '10px', color: 'var(--text-faint)', marginBottom: '2px' }}>{senderName}</span>
                          {msg.offer_amount != null ? (
                            <div style={{ background: 'var(--bg-card)', border: '1px solid #c8d4e8', borderRadius: '12px', padding: '10px 14px', minWidth: '160px' }}>
                              <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: 0 }}>💰 Preisangebot</p>
                              <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{msg.offer_amount.toFixed(2)} €</p>
                              <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '4px 0 0' }}>Status: {msg.offer_status}</p>
                            </div>
                          ) : (
                            <div style={{ padding: '10px 14px', borderRadius: isA ? '14px 14px 14px 4px' : '14px 14px 4px 14px', fontSize: '14px', lineHeight: 1.5, background: isA ? '#fff' : '#1a6e3a', color: isA ? '#1a2040' : '#fff', border: isA ? '1px solid #e0dcd4' : 'none' }}>
                              {msg.content}
                            </div>
                          )}
                          <span style={{ fontSize: '10px', color: 'var(--text-faint)', marginTop: '3px' }}>
                            {new Date(msg.created_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
