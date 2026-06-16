'use client'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'

export default function Navbar({ username }: { username?: string }) {
  const router = useRouter()
  const supabase = createClient()
  const [chatOpen, setChatOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [chats, setChats] = useState<any[]>([])
  const [unread, setUnread] = useState(0)
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadNotifs, setUnreadNotifs] = useState(0)
  const [isAdmin, setIsAdmin] = useState(false)
  const chatRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles').select('*').eq('id', user.id).single()
    setIsAdmin(profile?.is_admin || false)

    const { data: msgs } = await supabase
      .from('messages')
      .select('*, sender:profiles!sender_id(username, display_name), receiver:profiles!receiver_id(username, display_name)')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false })

    if (msgs) {
      const seen = new Set()
      const grouped: any[] = []
      let unreadCount = 0
      for (const msg of msgs) {
        const otherId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id
        const otherProfile = msg.sender_id === user.id ? msg.receiver : msg.sender
        const otherName = otherProfile?.display_name || otherProfile?.username
        if (!seen.has(otherId)) {
          seen.add(otherId)
          const unreadMsgs = msgs.filter(m => m.sender_id === otherId && m.receiver_id === user.id && !m.read).length
          if (unreadMsgs > 0) unreadCount += unreadMsgs
          grouped.push({ otherId, otherName, lastMsg: msg.content, time: msg.created_at, unread: unreadMsgs })
        }
      }
      setChats(grouped)
      setUnread(unreadCount)
    }

    const { data: notifs } = await supabase
      .from('notifications').select('*').eq('user_id', user.id)
      .order('created_at', { ascending: false }).limit(10)

    if (notifs) {
      setNotifications(notifs)
      setUnreadNotifs(notifs.filter(n => !n.read).length)
    }
  }

  useEffect(() => {
    loadData()
    const channel = supabase.channel('navbar-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => loadData())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, () => loadData())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, () => loadData())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (chatRef.current && !chatRef.current.contains(e.target as Node)) setChatOpen(false)
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false)
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  async function markNotifsRead() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false)
    setUnreadNotifs(0)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  async function openChat(otherId: string) {
    await fetch('/api/messages/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senderId: otherId })
    })
    setChats(prev => prev.map(c => c.otherId === otherId ? { ...c, unread: 0 } : c))
    setUnread(prev => {
      const chat = chats.find(c => c.otherId === otherId)
      return Math.max(0, prev - (chat?.unread || 0))
    })
    router.push(`/chat/${otherId}`)
    setChatOpen(false)
  }

  function formatTime(ts: string) {
    return new Date(ts).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <nav style={{ background: '#1a3a6e', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', height: '54px', position: 'sticky', top: 0, zIndex: 50 }}>
      <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
        <div style={{ fontSize: '16px', fontWeight: 500, color: '#fff', letterSpacing: '0.01em', lineHeight: 1.2 }}>
          LFS Köln
          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', display: 'block' }}>Liebfrauenschule</span>
        </div>
        <div style={{ width: '1px', height: '28px', background: 'rgba(255,255,255,0.2)' }} />
        <div style={{ fontSize: '15px', fontWeight: 500, color: '#f0c040' }}>Markt</div>
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {username && (
            <Link href="/my-posts" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', textDecoration: 'none', padding: '6px 12px', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '4px' }}>
              Meine Inserate
            </Link>
          )}
          {isAdmin && (
            <Link href="/admin" style={{ fontSize: '12px', color: '#f0c040', textDecoration: 'none', padding: '6px 12px', border: '1px solid rgba(240,192,64,0.3)', borderRadius: '4px' }}>
              Admin
            </Link>
          )}
        </div>

        <div style={{ position: 'relative' }} ref={notifRef}>
          <button onClick={() => { setNotifOpen(!notifOpen); if (!notifOpen) markNotifsRead() }}
            style={{ position: 'relative', width: '36px', height: '36px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '16px' }}>
            🔔
            {unreadNotifs > 0 && (
              <div style={{ position: 'absolute', top: '-3px', right: '-3px', width: '16px', height: '16px', background: '#e05252', borderRadius: '50%', fontSize: '9px', fontWeight: 500, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #1a3a6e' }}>
                {unreadNotifs}
              </div>
            )}
          </button>
          {notifOpen && (
            <div style={{ position: 'fixed', top: '58px', right: '8px', width: 'min(320px, calc(100vw - 16px))', background: '#fff', border: '1px solid #e0dcd4', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 100, overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0ece4' }}>
                <span style={{ fontSize: '14px', fontWeight: 500, color: '#1a3a6e' }}>Benachrichtigungen</span>
              </div>
              {notifications.length === 0 && (
                <div style={{ padding: '20px', textAlign: 'center', color: '#aaa', fontSize: '13px' }}>Keine Benachrichtigungen</div>
              )}
              {notifications.map(notif => (
                <div key={notif.id} onClick={() => { if (notif.link) router.push(notif.link); setNotifOpen(false) }}
                  style={{ padding: '12px 16px', borderBottom: '1px solid #f7f5f0', cursor: notif.link ? 'pointer' : 'default', background: notif.read ? '#fff' : '#fafbff' }}>
                  <p style={{ fontSize: '13px', color: '#1a2040', lineHeight: 1.5 }}>{notif.message}</p>
                  <p style={{ fontSize: '11px', color: '#bbb', marginTop: '4px' }}>{formatTime(notif.created_at)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ position: 'relative' }} ref={chatRef}>
          <button onClick={() => setChatOpen(!chatOpen)}
            style={{ position: 'relative', width: '36px', height: '36px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '16px' }}>
            💬
            {unread > 0 && (
              <div style={{ position: 'absolute', top: '-3px', right: '-3px', width: '16px', height: '16px', background: '#e05252', borderRadius: '50%', fontSize: '9px', fontWeight: 500, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #1a3a6e' }}>
                {unread}
              </div>
            )}
          </button>
          {chatOpen && (
            <div style={{ position: 'fixed', top: '58px', right: '8px', width: 'min(300px, calc(100vw - 16px))', background: '#fff', border: '1px solid #e0dcd4', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 100, overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0ece4', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '14px', fontWeight: 500, color: '#1a3a6e' }}>Nachrichten</span>
                {unread > 0 && <span style={{ background: '#eef2f8', color: '#1a3a6e', fontSize: '11px', padding: '2px 8px', borderRadius: '3px' }}>{unread} neu</span>}
              </div>
              {chats.length === 0 && (
                <div style={{ padding: '20px', textAlign: 'center', color: '#aaa', fontSize: '13px' }}>Noch keine Nachrichten</div>
              )}
              {chats.map(chat => (
                <div key={chat.otherId} onClick={() => openChat(chat.otherId)}
                  style={{ padding: '11px 16px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', borderBottom: '1px solid #f7f5f0', background: chat.unread > 0 ? '#fafbff' : '#fff' }}>
                  <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#eef2f8', border: '1px solid #c8d4e8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 500, color: '#1a3a6e', flexShrink: 0 }}>
                    {chat.otherName?.[0]?.toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: '#1a2040', marginBottom: '2px' }}>{chat.otherName}</div>
                    <div style={{ fontSize: '11px', color: '#aaa', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{chat.lastMsg}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '10px', color: '#ccc', marginBottom: '3px' }}>{formatTime(chat.time)}</div>
                    {chat.unread > 0 && (
                      <div style={{ width: '18px', height: '18px', background: '#1a3a6e', borderRadius: '50%', fontSize: '10px', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: 'auto' }}>
                        {chat.unread}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div style={{ padding: '10px 16px', borderTop: '1px solid #f0ece4' }}>
                <Link href="/my-posts" onClick={() => setChatOpen(false)}
                  style={{ display: 'block', textAlign: 'center', fontSize: '12px', color: '#1a3a6e', textDecoration: 'none', fontWeight: 500 }}>
                  Meine Inserate ansehen
                </Link>
              </div>
            </div>
          )}
        </div>

        <div style={{ position: 'relative' }} ref={menuRef}>
          <button onClick={() => setMenuOpen(!menuOpen)}
            style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#f0c040', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 500, color: '#1a3a6e', cursor: 'pointer' }}>
            {username?.[0]?.toUpperCase()}
          </button>
          {menuOpen && (
            <div style={{ position: 'fixed', top: '58px', right: '8px', width: '180px', background: '#fff', border: '1px solid #e0dcd4', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 100, overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0ece4' }}>
                <p style={{ fontSize: '13px', fontWeight: 500, color: '#1a2040' }}>{username}</p>
              </div>
              <Link href="/profile" onClick={() => setMenuOpen(false)}
                style={{ display: 'block', padding: '11px 16px', fontSize: '13px', color: '#1a2040', textDecoration: 'none', borderBottom: '1px solid #f7f5f0' }}>
                Mein Profil
              </Link>
              <Link href="/my-posts" onClick={() => setMenuOpen(false)}
                style={{ display: 'block', padding: '11px 16px', fontSize: '13px', color: '#1a2040', textDecoration: 'none', borderBottom: '1px solid #f7f5f0' }}>
                Meine Inserate
              </Link>
              {isAdmin && (
                <Link href="/admin" onClick={() => setMenuOpen(false)}
                  style={{ display: 'block', padding: '11px 16px', fontSize: '13px', color: '#f0c040', textDecoration: 'none', borderBottom: '1px solid #f7f5f0', background: '#1a3a6e' }}>
                  Admin
                </Link>
              )}
              <button onClick={logout}
                style={{ width: '100%', padding: '11px 16px', fontSize: '13px', color: '#b91c1c', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer' }}>
                Abmelden
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}