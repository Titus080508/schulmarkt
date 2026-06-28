'use client'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'

function BellIcon({ size = 17, color = 'currentColor' }: { size?: number, color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 1 1 12 0c0 3.2 1 5 2 6.5H4C5 13 6 11.2 6 8Z" />
      <path d="M9.5 18.5a2.5 2.5 0 0 0 5 0" />
    </svg>
  )
}

function ChatIcon({ size = 17, color = 'currentColor' }: { size?: number, color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12c0 4.4-4 8-9 8-1.1 0-2.2-.2-3.1-.5L4 21l1.2-4C4.4 15.7 3 14 3 12c0-4.4 4-8 9-8s9 3.6 9 8Z" />
    </svg>
  )
}

function MenuLineIcon({ d, size = 15, color = 'currentColor' }: { d: string, size?: number, color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  )
}

const navIcons = {
  profile: 'M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Z M4.5 20.5c1-3.5 4-5.5 7.5-5.5s6.5 2 7.5 5.5',
  heart: 'M12 20.5s-7.5-4.6-9.8-9.1C.7 8.1 2.2 5 5.4 4.3c2-.4 3.8.5 4.9 2.1.2.3.6.3.8 0 1.1-1.6 2.9-2.5 4.9-2.1 3.2.7 4.7 3.8 3.2 7.1-2.3 4.5-9.8 9.1-9.8 9.1Z',
  list: 'M8 6h12M8 12h12M8 18h12 M4 6h.01M4 12h.01M4 18h.01',
  admin: 'M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z',
  logout: 'M9 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4 M16 16l4-4-4-4 M20 12H9'
}

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
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles').select('*').eq('id', user.id).single()
    setIsAdmin(profile?.is_admin || false)

    if (profile?.suspended) {
      sessionStorage.setItem('suspended_reason', profile.suspended_reason || '')
      await supabase.auth.signOut()
      router.push('/suspended')
      return
    }

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
    <nav className={`navbar-modern${scrolled ? ' scrolled' : ''}`} style={{ background: '#1a3a6e', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', height: '56px', position: 'sticky', top: 0, zIndex: 50 }}>
      <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
        <span style={{ fontSize: '16px', fontWeight: 600, color: '#fff', letterSpacing: '0.01em' }}>LFS</span>
        <span style={{ fontSize: '16px', fontWeight: 600, color: '#f0c040' }}>Markt</span>
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button onClick={() => { setNotifOpen(!notifOpen); if (!notifOpen) markNotifsRead() }} className="icon-btn-modern"
            style={{ position: 'relative', width: '36px', height: '36px', background: 'transparent', border: 'none', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
            <BellIcon size={17} />
            {unreadNotifs > 0 && (
              <div className="icon-badge-modern" style={{ position: 'absolute', top: '2px', right: '2px', width: '8px', height: '8px', background: '#e05252', borderRadius: '50%', border: '2px solid #1a3a6e' }} />
            )}
          </button>
          {notifOpen && (
            <div className="dropdown-pop" style={{ position: 'fixed', top: '64px', right: '12px', width: 'min(320px, calc(100vw - 16px))', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', boxShadow: '0 12px 28px rgba(0,0,0,0.14)', zIndex: 100, overflow: 'hidden' }}>
              <div style={{ padding: '13px 16px', borderBottom: '1px solid var(--border-light)' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Benachrichtigungen</span>
              </div>
              <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
                {notifications.length === 0 && (
                  <div style={{ padding: '28px 16px', textAlign: 'center', color: 'var(--text-faint)', fontSize: '13px' }}>Keine Benachrichtigungen</div>
                )}
                {notifications.map(notif => (
                  <div key={notif.id} onClick={() => { if (notif.link) router.push(notif.link); setNotifOpen(false) }} className="nav-menu-item"
                    style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-light)', cursor: notif.link ? 'pointer' : 'default', background: notif.read ? 'transparent' : 'var(--bg-page)' }}>
                    <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.5, margin: 0 }}>{notif.message}</p>
                    <p style={{ fontSize: '11px', color: 'var(--text-faint)', marginTop: '4px', margin: 0 }}>{formatTime(notif.created_at)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ position: 'relative' }} ref={chatRef}>
          <button onClick={() => setChatOpen(!chatOpen)} className="icon-btn-modern"
            style={{ position: 'relative', width: '36px', height: '36px', background: 'transparent', border: 'none', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
            <ChatIcon size={17} />
            {unread > 0 && (
              <div className="icon-badge-modern" style={{ position: 'absolute', top: '2px', right: '2px', width: '8px', height: '8px', background: '#e05252', borderRadius: '50%', border: '2px solid #1a3a6e' }} />
            )}
          </button>
          {chatOpen && (
            <div className="dropdown-pop" style={{ position: 'fixed', top: '64px', right: '12px', width: 'min(300px, calc(100vw - 16px))', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', boxShadow: '0 12px 28px rgba(0,0,0,0.14)', zIndex: 100, overflow: 'hidden' }}>
              <div style={{ padding: '13px 16px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Nachrichten</span>
                {unread > 0 && <span style={{ background: '#eef2f8', color: '#1a3a6e', fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '999px' }}>{unread} neu</span>}
              </div>
              <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
                {chats.length === 0 && (
                  <div style={{ padding: '28px 16px', textAlign: 'center', color: 'var(--text-faint)', fontSize: '13px' }}>Noch keine Nachrichten</div>
                )}
                {chats.map(chat => (
                  <div key={chat.otherId} onClick={() => openChat(chat.otherId)} className="nav-menu-item"
                    style={{ padding: '11px 16px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', borderBottom: '1px solid var(--border-light)', background: chat.unread > 0 ? 'var(--bg-page)' : 'transparent' }}>
                    <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#eef2f8', border: '1px solid #c8d4e8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 600, color: '#1a3a6e', flexShrink: 0 }}>
                      {chat.otherName?.[0]?.toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '2px' }}>{chat.otherName}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-faint)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{chat.lastMsg}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: '10px', color: 'var(--text-faint)', marginBottom: '3px' }}>{formatTime(chat.time)}</div>
                      {chat.unread > 0 && (
                        <div style={{ width: '18px', height: '18px', background: '#1a3a6e', borderRadius: '50%', fontSize: '10px', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: 'auto' }}>
                          {chat.unread}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border-light)' }}>
                <Link href="/my-posts" onClick={() => setChatOpen(false)}
                  style={{ display: 'block', textAlign: 'center', fontSize: '12px', color: '#1a3a6e', textDecoration: 'none', fontWeight: 600 }}>
                  Meine Inserate ansehen
                </Link>
              </div>
            </div>
          )}
        </div>

        <div style={{ position: 'relative' }} ref={menuRef}>
          <button onClick={() => setMenuOpen(!menuOpen)} className="icon-btn-modern burger-btn" aria-label="Menü"
            style={{ width: '36px', height: '36px', borderRadius: '50%', background: menuOpen ? 'rgba(255,255,255,0.18)' : 'transparent', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <span className={`burger-icon${menuOpen ? ' open' : ''}`}>
              <span /><span /><span />
            </span>
          </button>
          {menuOpen && (
            <div className="dropdown-pop" style={{ position: 'fixed', top: '64px', right: '12px', width: '210px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', boxShadow: '0 12px 28px rgba(0,0,0,0.14)', zIndex: 100, overflow: 'hidden' }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#f0c040', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 600, color: '#1a3a6e', flexShrink: 0 }}>
                  {username?.[0]?.toUpperCase()}
                </span>
                <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{username}</p>
              </div>
              <Link href="/profile" onClick={() => setMenuOpen(false)} className="nav-menu-item"
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', fontSize: '13px', color: 'var(--text-primary)', textDecoration: 'none' }}>
                <MenuLineIcon d={navIcons.profile} color="var(--text-faint)" />
                Mein Profil
              </Link>
              <Link href="/favorites" onClick={() => setMenuOpen(false)} className="nav-menu-item"
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', fontSize: '13px', color: 'var(--text-primary)', textDecoration: 'none' }}>
                <MenuLineIcon d={navIcons.heart} color="var(--text-faint)" />
                Favoriten
              </Link>
              <Link href="/my-posts" onClick={() => setMenuOpen(false)} className="nav-menu-item"
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', fontSize: '13px', color: 'var(--text-primary)', textDecoration: 'none' }}>
                <MenuLineIcon d={navIcons.list} color="var(--text-faint)" />
                Meine Inserate
              </Link>
              {isAdmin && (
                <Link href="/admin" onClick={() => setMenuOpen(false)} className="nav-menu-item"
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', fontSize: '13px', color: '#1a3a6e', fontWeight: 600, textDecoration: 'none' }}>
                  <MenuLineIcon d={navIcons.admin} color="#1a3a6e" />
                  Admin-Bereich
                </Link>
              )}
              <button onClick={logout} className="nav-menu-item"
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', fontSize: '13px', color: '#b91c1c', background: 'none', border: 'none', borderTop: '1px solid var(--border-light)', textAlign: 'left', cursor: 'pointer' }}>
                <MenuLineIcon d={navIcons.logout} color="#b91c1c" />
                Abmelden
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}