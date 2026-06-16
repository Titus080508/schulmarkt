'use client'
import { useEffect, useState, useRef } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import Navbar from '@/components/Navbar'
import Link from 'next/link'

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
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  const router = useRouter()

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

      channelRef = supabase.channel('chat-' + userId + '-' + Date.now())
      channelRef.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, async (payload: any) => {
        const newMsg = payload.new
        const isRelevant =
          (newMsg.sender_id === user.id && newMsg.receiver_id === userId) ||
          (newMsg.sender_id === userId && newMsg.receiver_id === user.id)
        if (!isRelevant) return
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
      }).subscribe()
    }

    load()
    return () => { if (channelRef) supabase.removeChannel(channelRef) }
  }, [userId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage() {
    if (!input.trim() || !me) return
    const content = input.trim()
    setInput('')
    await supabase.from('messages').insert({
      sender_id: me.id,
      receiver_id: userId,
      post_id: postId || null,
      content
    })
  }

  const myDisplayName = myProfile?.display_name || myProfile?.username
  const otherDisplayName = other?.display_name || other?.username

  return (
    <div style={{ minHeight: '100vh', background: '#f7f5f0', display: 'flex', flexDirection: 'column' }}>
      <Navbar username={myDisplayName} />
      <main style={{ maxWidth: '700px', margin: '0 auto', width: '100%', padding: '24px 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Link href="/dashboard" style={{ fontSize: '13px', color: '#1a3a6e', textDecoration: 'none', marginBottom: '16px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          ← Zurück
        </Link>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', border: '1px solid #e0dcd4', borderRadius: '10px', overflow: 'hidden', background: '#fff' }}>
          <div style={{ background: '#fff', padding: '14px 20px', borderBottom: '1px solid #f0ece4', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#eef2f8', border: '1px solid #c8d4e8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 500, color: '#1a3a6e' }}>
              {otherDisplayName?.[0]?.toUpperCase()}
            </div>
            <div>
              <p style={{ fontSize: '14px', fontWeight: 500, color: '#1a2040' }}>{otherDisplayName}</p>
              <p style={{ fontSize: '11px', color: '#1a3a6e' }}>Online</p>
            </div>
          </div>
          {post && (
            <div style={{ background: '#f7f5f0', padding: '10px 20px', borderBottom: '1px solid #f0ece4', fontSize: '12px', color: '#888', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Wegen: <span style={{ color: '#1a2040', fontWeight: 500 }}>{post.title}</span>
              <span style={{ color: '#1a3a6e', fontWeight: 500 }}>{post.price?.toFixed(2)} €</span>
            </div>
          )}
          <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', minHeight: '300px', background: '#fafcf8' }}>
            {messages.length === 0 && (
              <p style={{ textAlign: 'center', color: '#aaa', fontSize: '13px', marginTop: '40px' }}>Noch keine Nachrichten.</p>
            )}
            {messages.map(msg => (
              <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', maxWidth: '70%', alignSelf: msg.sender_id === me?.id ? 'flex-end' : 'flex-start', alignItems: msg.sender_id === me?.id ? 'flex-end' : 'flex-start' }}>
                <div style={{ padding: '10px 14px', borderRadius: msg.sender_id === me?.id ? '14px 14px 4px 14px' : '14px 14px 14px 4px', fontSize: '14px', lineHeight: 1.5, background: msg.sender_id === me?.id ? '#1a3a6e' : '#fff', color: msg.sender_id === me?.id ? '#fff' : '#1a2040', border: msg.sender_id === me?.id ? 'none' : '1px solid #e0dcd4' }}>
                  {msg.content}
                </div>
                <span style={{ fontSize: '10px', color: '#aaa', marginTop: '3px' }}>
                  {new Date(msg.created_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
          <div style={{ background: '#fff', borderTop: '1px solid #f0ece4', padding: '12px 16px', display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              style={{ flex: 1, background: '#f7f5f0', border: '1px solid #ddd', borderRadius: '6px', padding: '10px 16px', fontSize: '14px', color: '#1a2040', outline: 'none' }}
              placeholder="Nachricht schreiben..."
            />
            <button onClick={sendMessage}
              style={{ width: '38px', height: '38px', background: '#1a3a6e', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              ➤
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}