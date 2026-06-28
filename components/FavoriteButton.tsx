'use client'
import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'

function HeartIcon({ size = 16, filled = false, color = 'currentColor' }: { size?: number, filled?: boolean, color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : 'none'} stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20.5s-7.5-4.6-9.8-9.1C.7 8.1 2.2 5 5.4 4.3c2-.4 3.8.5 4.9 2.1.2.3.6.3.8 0 1.1-1.6 2.9-2.5 4.9-2.1 3.2.7 4.7 3.8 3.2 7.1-2.3 4.5-9.8 9.1-9.8 9.1Z" />
    </svg>
  )
}

export default function FavoriteButton({ postId, userId, initialFavorite }: { postId: string, userId: string, initialFavorite: boolean }) {
  const [isFav, setIsFav] = useState(initialFavorite)
  const [loading, setLoading] = useState(false)
  const [popped, setPopped] = useState(false)
  const supabase = createClient()

  async function toggle() {
    setLoading(true)
    const next = !isFav
    setIsFav(next)
    setPopped(true)
    setTimeout(() => setPopped(false), 400)
    if (next) {
      await supabase.from('favorites').insert({ user_id: userId, post_id: postId })
    } else {
      await supabase.from('favorites').delete().eq('user_id', userId).eq('post_id', postId)
    }
    setLoading(false)
  }

  return (
    <button onClick={toggle} disabled={loading} className="icon-btn-modern"
      style={{ width: '40px', height: '40px', borderRadius: '50%', background: isFav ? '#fef2f2' : 'var(--bg-card)', border: `1px solid ${isFav ? '#fecaca' : 'var(--border-color)'}`, color: isFav ? '#b91c1c' : '#999', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <span className={popped ? 'icon-pop' : ''} style={{ display: 'flex' }}>
        <HeartIcon size={17} filled={isFav} />
      </span>
    </button>
  )
}
