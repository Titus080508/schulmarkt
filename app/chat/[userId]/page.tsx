'use client'
import { useEffect, useState, useRef } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import CategoryIcon from '@/components/CategoryIcon'
import { categoryPlaceholderBg, CATEGORY_ICON_OPACITY } from '@/utils/categoryStyle'

function formatDay(ts: string) {
  const d = new Date(ts)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Heute'
  if (d.toDateString() === yesterday.toDateString()) return 'Gestern'
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function ChatPage() {
  const params = useParams()
  const userId = params.userId as string
  const searchParams = useSearchParams()
  const postId = searchParams.get('post')
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState('')
  const [me, setMe] = useState<any>(null)
  const [other, setOther] = useState<any>(null)
  const [post, setPost] = useState<any>(null)
  const [myProfile, setMyProfile] = useState<any>(null)
  const [conversations, setConversations] = useState<any[]>([])
  const [userSearch, setUserSearch] = useState('')
  const [userSearchResults, setUserSearchResults] = useState<any[]>([])
  const [searchingUsers, setSearchingUsers] = useState(false)
  const [blockedByMe, setBlockedByMe] = useState(false)
  const [blockedMe, setBlockedMe] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportOther, setReportOther] = useState('')
  const [reportDone, setReportDone] = useState(false)
  const [reportError, setReportError] = useState('')
  const [reportingMsgId, setReportingMsgId] = useState<string | null>(null)
  const [msgReportReason, setMsgReportReason] = useState('')
  const [msgReportOther, setMsgReportOther] = useState('')
  const [msgReportError, setMsgReportError] = useState('')
  const [reportedMsgIds, setReportedMsgIds] = useState<Set<string>>(new Set())
  const [offerOpen, setOfferOpen] = useState(false)
  const [offerAmount, setOfferAmount] = useState('')
  const [sendPop, setSendPop] = useState(false)
  const [offerSent, setOfferSent] = useState(false)
  const [counterOfferId, setCounterOfferId] = useState<string | null>(null)
  const [counterAmount, setCounterAmount] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  const router = useRouter()

  async function loadBlockStatus(myId: string) {
    const { data } = await supabase
      .from('blocks').select('*')
      .or(`and(blocker_id.eq.${myId},blocked_id.eq.${userId}),and(blocker_id.eq.${userId},blocked_id.eq.${myId})`)
    setBlockedByMe(!!data?.find(b => b.blocker_id === myId))
    setBlockedMe(!!data?.find(b => b.blocker_id === userId))
  }

  async function toggleBlock() {
    setMenuOpen(false)
    if (!me) return
    if (blockedByMe) {
      await supabase.from('blocks').delete().eq('blocker_id', me.id).eq('blocked_id', userId)
      setBlockedByMe(false)
    } else {
      await supabase.from('blocks').insert({ blocker_id: me.id, blocked_id: userId })
      setBlockedByMe(true)
    }
  }

  async function submitReport() {
    if (!reportReason || !me) return
    if (reportReason === 'Sonstiges' && !reportOther.trim()) return
    setReportError('')
    const reason = reportReason === 'Sonstiges' ? `Sonstiges: ${reportOther.trim()}` : reportReason
    const { error } = await supabase.from('user_reports').insert({ reporter_id: me.id, reported_id: userId, reason })
    if (error) { setReportError(error.message); return }
    setReportDone(true)
  }

  async function submitMessageReport(messageId: string) {
    if (!msgReportReason) return
    if (msgReportReason === 'Sonstiges' && !msgReportOther.trim()) return
    setMsgReportError('')
    const reason = msgReportReason === 'Sonstiges' ? `Sonstiges: ${msgReportOther.trim()}` : msgReportReason
    const res = await fetch(`/report/message/${messageId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason })
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setMsgReportError(data.error || 'Meldung konnte nicht gesendet werden.')
      return
    }
    setReportedMsgIds(prev => new Set(prev).add(messageId))
    setReportingMsgId(null)
    setMsgReportReason('')
    setMsgReportOther('')
  }

  const hasPendingOffer = messages.some(m => m.offer_status === 'pending')

  async function sendOffer(customAmount?: number) {
    const amount = customAmount ?? parseFloat(offerAmount)
    if (isNaN(amount) || amount < 0 || !me) return
    const offer_expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    await supabase.from('messages').insert({
      sender_id: me.id,
      receiver_id: userId,
      post_id: postId || null,
      content: `Angebot: ${amount.toFixed(2)} €`,
      offer_amount: amount,
      offer_status: 'pending',
      offer_expires_at
    })
    setOfferAmount('')
    setOfferOpen(false)
    setOfferSent(true)
    setTimeout(() => setOfferSent(false), 1500)
  }

  async function respondOffer(messageId: string, status: 'accepted' | 'declined') {
    await supabase.from('messages').update({ offer_status: status }).eq('id', messageId)
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, offer_status: status } : m))
  }

  async function sendCounterOffer(originalId: string) {
    const amount = parseFloat(counterAmount)
    if (isNaN(amount) || amount < 0) return
    await respondOffer(originalId, 'declined')
    await sendOffer(amount)
    setCounterOfferId(null)
    setCounterAmount('')
  }

  async function loadConversations(currentUserId: string) {
    const { data: msgs } = await supabase
      .from('messages')
      .select('*, sender:profiles!sender_id(username, display_name), receiver:profiles!receiver_id(username, display_name)')
      .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
      .order('created_at', { ascending: false })

    if (!msgs) return
    const seen = new Set()
    const grouped: any[] = []
    for (const msg of msgs) {
      const otherId = msg.sender_id === currentUserId ? msg.receiver_id : msg.sender_id
      const otherProfile = msg.sender_id === currentUserId ? msg.receiver : msg.sender
      const otherName = otherProfile?.display_name || otherProfile?.username
      if (!seen.has(otherId)) {
        seen.add(otherId)
        const unread = msgs.filter(m => m.sender_id === otherId && m.receiver_id === currentUserId && !m.read).length
        grouped.push({ otherId, otherName, lastMsg: msg.content, time: msg.created_at, unread, isMine: msg.sender_id === currentUserId })
      }
    }
    setConversations(grouped)
  }

  async function searchUsers(query: string, currentUserId: string) {
    if (query.trim().length < 2) { setUserSearchResults([]); return }
    setSearchingUsers(true)
    const q = query.trim().replace(/[%_]/g, '')
    const { data } = await supabase
      .from('profiles')
      .select('id, username, display_name')
      .neq('id', currentUserId)
      .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
      .limit(8)
    setUserSearchResults(data || [])
    setSearchingUsers(false)
  }

  useEffect(() => {
    let channelRef: any = null

    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setMe(user)

      const [{ data: myProf }, { data: otherProf }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('profiles').select('*').eq('id', userId).single()
      ])
      setMyProfile(myProf)
      setOther(otherProf)

      if (postId) {
        const { data: postData } = await supabase.from('posts').select('*').eq('id', postId).single()
        setPost(postData)
      }

      const { data: msgs } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true })
      setMessages(msgs || [])

      await fetch('/api/messages/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderId: userId })
      })

      await loadConversations(user.id)
      await loadBlockStatus(user.id)

      channelRef = supabase.channel('chat-' + userId + '-' + Date.now())
      channelRef.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, async (payload: any) => {
        const newMsg = payload.new
        const isRelevant =
          (newMsg.sender_id === user.id && newMsg.receiver_id === userId) ||
          (newMsg.sender_id === userId && newMsg.receiver_id === user.id)
        if (isRelevant) {
          setMessages(prev => {
            if (prev.find(m => m.id === newMsg.id)) return prev
            return [...prev, newMsg]
          })
          if (newMsg.sender_id === userId) {
            await fetch('/api/messages/read', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ senderId: userId })
            })
          }
        }
        if (newMsg.sender_id === user.id || newMsg.receiver_id === user.id) {
          loadConversations(user.id)
        }
      }).subscribe()
    }

    load()
    return () => { if (channelRef) supabase.removeChannel(channelRef) }
  }, [userId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!me) return
    const timeout = setTimeout(() => searchUsers(userSearch, me.id), 300)
    return () => clearTimeout(timeout)
  }, [userSearch, me])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function sendMessage() {
    if (!input.trim() || !me || blockedByMe || blockedMe) return
    const content = input.trim()
    setInput('')
    setSendPop(true)
    setTimeout(() => setSendPop(false), 350)
    await supabase.from('messages').insert({
      sender_id: me.id,
      receiver_id: userId,
      post_id: postId || null,
      content
    })

    fetch('/api/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        receiverId: userId,
        title: `Neue Nachricht von ${myProfile?.display_name || myProfile?.username}`,
        body: content,
        url: `/chat/${me.id}`
      })
    }).catch(() => {})
  }

  const myDisplayName = myProfile?.display_name || myProfile?.username
  const otherDisplayName = other?.display_name || other?.username

  let lastDay = ''

  return (
    <div style={{ height: '100vh', background: 'var(--bg-page)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Navbar username={myDisplayName} />
      <main className="chat-main" style={{ maxWidth: 'var(--content-max)', margin: '0 auto', width: '100%', padding: '24px 20px', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
        <Link href="/dashboard" className="chat-back link-modern" style={{ fontSize: '13px', color: 'var(--color-primary)', textDecoration: 'none', marginBottom: '16px', display: 'inline-flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          ← Zurück
        </Link>

        <div style={{ flex: 1, display: 'flex', border: '1px solid var(--border-color)', borderRadius: '10px', overflow: 'hidden', background: 'var(--bg-card)', minHeight: 0 }}>

          <div className="desktop-only" style={{ width: '280px', flexShrink: 0, borderRight: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', background: 'var(--bg-card)', minHeight: 0 }}>
            <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border-light)' }}>
              <p style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 10px' }}>Nachrichten</p>
              <input type="text" value={userSearch} onChange={e => setUserSearch(e.target.value)}
                placeholder="Nutzer suchen..."
                style={{ width: '100%', background: 'var(--bg-page)', border: '1px solid var(--border-input)', borderRadius: '999px', padding: '8px 14px', fontSize: '13px', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {userSearch.trim().length >= 2 ? (
                <>
                  {searchingUsers && (
                    <p style={{ textAlign: 'center', color: 'var(--text-faint)', fontSize: '13px', padding: '24px' }}>Suche...</p>
                  )}
                  {!searchingUsers && userSearchResults.length === 0 && (
                    <p style={{ textAlign: 'center', color: 'var(--text-faint)', fontSize: '13px', padding: '24px' }}>Keine Nutzer gefunden.</p>
                  )}
                  {userSearchResults.map(result => {
                    const name = result.display_name || result.username
                    return (
                      <div key={result.id} onClick={() => { router.push(`/chat/${result.id}`); setUserSearch(''); setUserSearchResults([]) }} className="row-modern"
                        style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 20px', cursor: 'pointer' }}>
                        <div className="avatar-modern" style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: 600, color: 'var(--color-primary)', flexShrink: 0 }}>
                          {name?.[0]?.toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</p>
                          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>@{result.username}</p>
                        </div>
                      </div>
                    )
                  })}
                </>
              ) : (
                <>
                  {conversations.length === 0 && (
                    <p style={{ textAlign: 'center', color: 'var(--text-faint)', fontSize: '13px', padding: '24px' }}>Noch keine Unterhaltungen.</p>
                  )}
                  {conversations.map(conv => {
                const active = conv.otherId === userId
                return (
                  <div key={conv.otherId} onClick={() => router.push(`/chat/${conv.otherId}`)} className="row-modern"
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 20px', cursor: 'pointer', background: active ? 'var(--state-success-bg)' : 'transparent', borderLeft: active ? '3px solid var(--state-success)' : '3px solid transparent' }}>
                    <div className="avatar-modern" style={{ position: 'relative', width: '40px', height: '40px', borderRadius: '50%', background: 'var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: 600, color: 'var(--color-primary)', flexShrink: 0 }}>
                      {conv.otherName?.[0]?.toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '6px' }}>
                        <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{conv.otherName}</p>
                        <span style={{ fontSize: '10px', color: 'var(--text-faint)', flexShrink: 0 }}>
                          {new Date(conv.time).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {conv.isMine && 'Du: '}{conv.lastMsg}
                      </p>
                    </div>
                    {conv.unread > 0 && (
                      <span style={{ background: 'var(--state-success)', color: 'var(--text-on-dark)', fontSize: '11px', fontWeight: 600, borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {conv.unread}
                      </span>
                    )}
                  </div>
                )
              })}
                </>
              )}
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0 }}>
            <div style={{ background: 'var(--bg-card)', padding: '14px 20px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
              <div className="avatar-modern" style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--border-light)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 600, color: 'var(--color-primary)' }}>
                {otherDisplayName?.[0]?.toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{otherDisplayName}</p>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>@{other?.username}</p>
              </div>
              <div style={{ position: 'relative' }} ref={menuRef}>
                <button onClick={() => setMenuOpen(!menuOpen)} className="icon-btn-modern"
                  style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-page)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  ⋮
                </button>
                {menuOpen && (
                  <div style={{ position: 'absolute', top: '40px', right: 0, width: '200px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: 'var(--shadow-lg)', zIndex: 50, overflow: 'hidden' }}>
                    <button onClick={toggleBlock}
                      style={{ width: '100%', textAlign: 'left', padding: '11px 16px', fontSize: '13px', color: 'var(--text-primary)', background: 'none', border: 'none', borderBottom: '1px solid var(--border-light)', cursor: 'pointer' }}>
                      {blockedByMe ? 'Entblocken' : 'Nutzer blockieren'}
                    </button>
                    <button onClick={() => { setMenuOpen(false); setReportOpen(true) }}
                      style={{ width: '100%', textAlign: 'left', padding: '11px 16px', fontSize: '13px', color: 'var(--state-danger)', background: 'none', border: 'none', cursor: 'pointer' }}>
                      Nutzer melden
                    </button>
                  </div>
                )}
              </div>
            </div>

            {reportOpen && (
              <div className="fade-in-up" style={{ margin: '12px 20px 0', background: 'var(--state-danger-bg)', border: '1px solid var(--state-danger-border)', borderRadius: '10px', padding: '14px', flexShrink: 0 }}>
                {reportDone ? (
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', margin: 0 }}>Meldung wurde übermittelt.</p>
                ) : (
                  <>
                    <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--state-danger)', marginBottom: '10px' }}>{otherDisplayName} melden</p>
                    <select value={reportReason} onChange={e => setReportReason(e.target.value)}
                      style={{ width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border-input)', borderRadius: '6px', padding: '9px 12px', fontSize: '13px', color: 'var(--text-primary)', outline: 'none', marginBottom: '10px', boxSizing: 'border-box' }}>
                      <option value="">Grund auswählen...</option>
                      <option>Belästigung / Beleidigung</option>
                      <option>Betrug / Täuschung</option>
                      <option>Spam</option>
                      <option>Unangemessenes Verhalten</option>
                      <option>Sonstiges</option>
                    </select>
                    {reportReason === 'Sonstiges' && (
                      <textarea value={reportOther} onChange={e => setReportOther(e.target.value)}
                        placeholder="Grund kurz beschreiben..." rows={2}
                        style={{ width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border-input)', borderRadius: '6px', padding: '9px 12px', fontSize: '13px', color: 'var(--text-primary)', outline: 'none', marginBottom: '10px', boxSizing: 'border-box', resize: 'vertical' }} />
                    )}
                    {reportError && (
                      <p style={{ fontSize: '12px', color: 'var(--state-danger)', marginBottom: '10px' }}>{reportError}</p>
                    )}
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => setReportOpen(false)}
                        style={{ flex: 1, background: 'var(--bg-page)', border: '1px solid var(--border-input)', color: 'var(--text-secondary)', fontSize: '13px', borderRadius: '6px', padding: '8px', cursor: 'pointer' }}>
                        Abbrechen
                      </button>
                      <button onClick={submitReport} disabled={!reportReason || (reportReason === 'Sonstiges' && !reportOther.trim())}
                        style={{ flex: 1, background: 'var(--state-danger)', border: 'none', color: 'var(--text-on-dark)', fontSize: '13px', fontWeight: 500, borderRadius: '6px', padding: '8px', cursor: 'pointer' }}>
                        Melden
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {(blockedByMe || blockedMe) && (
              <div style={{ margin: '12px 20px 0', background: 'var(--bg-page)', borderRadius: '8px', padding: '10px 14px', fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', flexShrink: 0 }}>
                {blockedByMe ? 'Du hast diesen Nutzer blockiert.' : 'Du wurdest von diesem Nutzer blockiert.'}
              </div>
            )}

            {post && (
              <Link href={`/post/${post.id}`} className="card-modern" style={{ textDecoration: 'none', margin: '12px 20px 0', background: 'var(--bg-page)', borderRadius: '10px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                <div className="thumb-modern" style={{ width: '44px', height: '44px', borderRadius: '6px', background: categoryPlaceholderBg(post.category), display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                  {post.image_url
                    ? <img src={post.image_url} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ opacity: CATEGORY_ICON_OPACITY }}><CategoryIcon category={post.category} size={24} color="var(--tag-color)" /></span>
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.title}</p>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--state-success)', margin: 0 }}>{post.price === 0 ? 'Zu verschenken 🎁' : `${post.price.toFixed(2)} €`}</p>
                </div>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-primary)', flexShrink: 0 }}>Ansehen</span>
              </Link>
            )}

            <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto', minHeight: 0, background: 'var(--bg-page)' }}>
              {messages.length === 0 && (
                <p style={{ textAlign: 'center', color: 'var(--text-faint)', fontSize: '13px', marginTop: '40px' }}>Noch keine Nachrichten.</p>
              )}
              {messages.map(msg => {
                const day = formatDay(msg.created_at)
                const showDivider = day !== lastDay
                lastDay = day
                return (
                  <div key={msg.id}>
                    {showDivider && (
                      <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-faint)', margin: '14px 0' }}>{day}</p>
                    )}
                    <div className="chat-bubble-modern" style={{ display: 'flex', flexDirection: 'column', maxWidth: '70%', marginBottom: '12px', alignSelf: msg.sender_id === me?.id ? 'flex-end' : 'flex-start', alignItems: msg.sender_id === me?.id ? 'flex-end' : 'flex-start', marginLeft: msg.sender_id === me?.id ? 'auto' : 0 }}>
                      {msg.offer_amount != null ? (() => {
                        const isExpired = msg.offer_status === 'pending' && msg.offer_expires_at && new Date(msg.offer_expires_at) < new Date()
                        return (
                        <div style={{ background: 'var(--bg-card)', border: `1px solid ${isExpired ? 'var(--border-color)' : 'var(--border-color)'}`, borderRadius: '12px', padding: '12px 16px', minWidth: '220px', opacity: isExpired ? 0.65 : 1 }}>
                          <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0, marginBottom: '4px' }}>💰 Preisangebot</p>
                          <p style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{msg.offer_amount.toFixed(2)} €</p>
                          {msg.offer_expires_at && msg.offer_status === 'pending' && !isExpired && (
                            <p style={{ fontSize: '10px', color: 'var(--text-faint)', marginTop: '2px', marginBottom: 0 }}>
                              Läuft ab: {new Date(msg.offer_expires_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr
                            </p>
                          )}
                          {isExpired && (
                            <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginTop: '8px', marginBottom: 0 }}>⏱ Abgelaufen</p>
                          )}
                          {!isExpired && msg.offer_status === 'pending' && msg.receiver_id === me?.id && (
                            counterOfferId === msg.id ? (
                              <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <input type="number" value={counterAmount} onChange={e => setCounterAmount(e.target.value)}
                                  placeholder="Gegenpreis in €" min="0" step="0.5" autoFocus
                                  style={{ width: '100%', background: 'var(--bg-page)', border: '1px solid var(--border-input)', borderRadius: '6px', padding: '7px 10px', fontSize: '13px', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }} />
                                <div style={{ display: 'flex', gap: '6px' }}>
                                  <button onClick={() => { setCounterOfferId(null); setCounterAmount('') }}
                                    style={{ flex: 1, background: 'var(--bg-page)', border: '1px solid var(--border-input)', color: 'var(--text-secondary)', fontSize: '12px', borderRadius: '6px', padding: '7px', cursor: 'pointer' }}>
                                    Abbrechen
                                  </button>
                                  <button onClick={() => sendCounterOffer(msg.id)} disabled={!counterAmount || isNaN(parseFloat(counterAmount))}
                                    style={{ flex: 1, background: 'var(--color-primary)', border: 'none', color: 'var(--text-on-dark)', fontSize: '12px', fontWeight: 500, borderRadius: '6px', padding: '7px', cursor: 'pointer' }}>
                                    Senden
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
                                <button onClick={() => respondOffer(msg.id, 'declined')}
                                  style={{ flex: 1, background: 'var(--bg-page)', border: '1px solid var(--border-input)', color: 'var(--text-secondary)', fontSize: '12px', borderRadius: '6px', padding: '7px', cursor: 'pointer' }}>
                                  Ablehnen
                                </button>
                                <button onClick={() => { setCounterOfferId(msg.id); setCounterAmount('') }}
                                  style={{ flex: 1, background: 'var(--border-light)', border: '1px solid var(--border-color)', color: 'var(--color-primary)', fontSize: '12px', borderRadius: '6px', padding: '7px', cursor: 'pointer' }}>
                                  Gegenangebot
                                </button>
                                <button onClick={() => respondOffer(msg.id, 'accepted')}
                                  style={{ flex: 1, background: 'var(--state-success)', border: 'none', color: 'var(--text-on-dark)', fontSize: '12px', fontWeight: 500, borderRadius: '6px', padding: '7px', cursor: 'pointer' }}>
                                  Annehmen
                                </button>
                              </div>
                            )
                          )}
                          {!isExpired && msg.offer_status === 'pending' && msg.receiver_id !== me?.id && (
                            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px', marginBottom: 0 }}>Wartet auf Antwort...</p>
                          )}
                          {msg.offer_status === 'accepted' && (
                            <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--state-success)', marginTop: '8px', marginBottom: 0 }}>✓ Angenommen</p>
                          )}
                          {msg.offer_status === 'declined' && !isExpired && (
                            <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--state-danger)', marginTop: '8px', marginBottom: 0 }}>✕ Abgelehnt</p>
                          )}
                        </div>
                        )
                      })() : (
                        <div style={{ padding: '10px 14px', borderRadius: msg.sender_id === me?.id ? '14px 14px 4px 14px' : '14px 14px 14px 4px', fontSize: '14px', lineHeight: 1.5, background: msg.sender_id === me?.id ? 'var(--state-success)' : 'var(--text-on-dark)', color: msg.sender_id === me?.id ? 'var(--text-on-dark)' : 'var(--color-primary)', border: msg.sender_id === me?.id ? 'none' : '1px solid var(--border-color)' }}>
                          {msg.content}
                        </div>
                      )}
                      <span style={{ fontSize: '10px', color: 'var(--text-faint)', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {new Date(msg.created_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                        {msg.sender_id !== me?.id && msg.offer_amount == null && (
                          reportedMsgIds.has(msg.id) ? (
                            <span style={{ color: 'var(--text-faint)' }}>gemeldet</span>
                          ) : (
                            <button onClick={() => { setReportingMsgId(reportingMsgId === msg.id ? null : msg.id); setMsgReportReason(''); setMsgReportOther(''); setMsgReportError('') }}
                              title="Nachricht melden"
                              style={{ background: 'none', border: 'none', color: 'var(--text-faint)', fontSize: '11px', cursor: 'pointer', padding: 0 }}>
                              melden
                            </button>
                          )
                        )}
                      </span>
                      {reportingMsgId === msg.id && (
                        <div className="fade-in-up" style={{ marginTop: '6px', width: '220px', background: 'var(--state-danger-bg)', border: '1px solid var(--state-danger-border)', borderRadius: '8px', padding: '10px' }}>
                          <select value={msgReportReason} onChange={e => setMsgReportReason(e.target.value)}
                            style={{ width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border-input)', borderRadius: '6px', padding: '7px 10px', fontSize: '12px', color: 'var(--text-primary)', outline: 'none', marginBottom: '8px', boxSizing: 'border-box' }}>
                            <option value="">Grund auswählen...</option>
                            <option>Belästigung / Beleidigung</option>
                            <option>Betrug / Täuschung</option>
                            <option>Spam</option>
                            <option>Unangemessenes Verhalten</option>
                            <option>Sonstiges</option>
                          </select>
                          {msgReportReason === 'Sonstiges' && (
                            <textarea value={msgReportOther} onChange={e => setMsgReportOther(e.target.value)}
                              placeholder="Grund kurz beschreiben..." rows={2}
                              style={{ width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border-input)', borderRadius: '6px', padding: '7px 10px', fontSize: '12px', color: 'var(--text-primary)', outline: 'none', marginBottom: '8px', boxSizing: 'border-box', resize: 'vertical' }} />
                          )}
                          {msgReportError && (
                            <p style={{ fontSize: '11px', color: 'var(--state-danger)', marginBottom: '8px' }}>{msgReportError}</p>
                          )}
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button onClick={() => setReportingMsgId(null)}
                              style={{ flex: 1, background: 'var(--bg-page)', border: '1px solid var(--border-input)', color: 'var(--text-secondary)', fontSize: '12px', borderRadius: '6px', padding: '6px', cursor: 'pointer' }}>
                              Abbrechen
                            </button>
                            <button onClick={() => submitMessageReport(msg.id)} disabled={!msgReportReason || (msgReportReason === 'Sonstiges' && !msgReportOther.trim())}
                              style={{ flex: 1, background: 'var(--state-danger)', border: 'none', color: 'var(--text-on-dark)', fontSize: '12px', fontWeight: 500, borderRadius: '6px', padding: '6px', cursor: 'pointer' }}>
                              Melden
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>

            {offerOpen && !blockedByMe && !blockedMe && (
              <div className="fade-in-up" style={{ margin: '0 16px 12px', background: 'var(--border-light)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px 14px', display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                <input type="number" value={offerAmount} onChange={e => setOfferAmount(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendOffer()}
                  placeholder="Preisvorschlag in €" min="0" step="0.5"
                  style={{ flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border-input)', borderRadius: '6px', padding: '8px 12px', fontSize: '13px', color: 'var(--text-primary)', outline: 'none' }} />
                <button onClick={() => sendOffer()} className={`btn-modern${offerSent ? ' flash-success' : ''}`}
                  style={{ background: 'var(--color-primary)', color: 'var(--text-on-dark)', border: 'none', borderRadius: '6px', padding: '8px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                  {offerSent ? <span className="check-pop">✓ Gesendet</span> : 'Senden'}
                </button>
              </div>
            )}

            <div style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border-light)', padding: '12px 16px', display: 'flex', gap: '10px', alignItems: 'center', flexShrink: 0 }}>
              <button onClick={() => setOfferOpen(!offerOpen)} disabled={blockedByMe || blockedMe || hasPendingOffer} className="icon-btn-modern"
                title={hasPendingOffer ? 'Es gibt bereits ein offenes Angebot' : 'Preisangebot senden'}
                style={{ width: '38px', height: '38px', background: 'var(--border-light)', border: '1px solid var(--border-color)', borderRadius: '50%', color: 'var(--color-primary)', fontSize: '15px', cursor: hasPendingOffer ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: (blockedByMe || blockedMe || hasPendingOffer) ? 0.4 : 1 }}>
                💰
              </button>
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                disabled={blockedByMe || blockedMe}
                style={{ flex: 1, background: 'var(--bg-page)', border: '1px solid var(--border-input)', borderRadius: '999px', padding: '10px 18px', fontSize: '14px', color: 'var(--text-primary)', outline: 'none', opacity: (blockedByMe || blockedMe) ? 0.6 : 1 }}
                placeholder={blockedByMe || blockedMe ? 'Nachrichten gesperrt' : 'Nachricht schreiben...'}
              />
              <button onClick={sendMessage} disabled={blockedByMe || blockedMe} className="btn-modern"
                style={{ width: '38px', height: '38px', background: 'var(--state-success)', border: 'none', borderRadius: '50%', color: 'var(--text-on-dark)', fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: (blockedByMe || blockedMe) ? 0.5 : 1 }}>
                <span className={sendPop ? 'icon-send' : ''} style={{ display: 'flex' }}>➤</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
