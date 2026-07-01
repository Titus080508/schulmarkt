'use client'
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { CATEGORY_TAG_STYLE, CATEGORY_BG } from '@/utils/categoryStyle'
import CategoryIcon from './CategoryIcon'

function SearchIcon({ size = 14, color = 'currentColor' }: { size?: number, color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  )
}

function FilterIcon({ size = 14, color = 'currentColor' }: { size?: number, color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6h16M7 12h10M10 18h4" />
    </svg>
  )
}

function HeartIcon({ size = 14, filled = false, color = 'currentColor' }: { size?: number, filled?: boolean, color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : 'none'} stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20.5s-7.5-4.6-9.8-9.1C.7 8.1 2.2 5 5.4 4.3c2-.4 3.8.5 4.9 2.1.2.3.6.3.8 0 1.1-1.6 2.9-2.5 4.9-2.1 3.2.7 4.7 3.8 3.2 7.1-2.3 4.5-9.8 9.1-9.8 9.1Z" />
    </svg>
  )
}

const categoryLabel: Record<string, string> = {
  calculator: 'Taschenrechner',
  lfs_shirt: 'LFS Sportshirt',
  clothing: 'Klamotten',
  notebook: 'Schulhefte',
  lecture: 'Lektüren',
  supplies: 'Schulzubehör',
  other: 'Sonstiges'
}
const PAGE_SIZE = 15

export default function PostGrid({ posts, currentUserId, initialFavoriteIds = [] }: { posts: any[], currentUserId: string, initialFavoriteIds?: string[] }) {
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState('newest')
  const [search, setSearch] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [onlyWithImage, setOnlyWithImage] = useState(false)
  const [onlyFree, setOnlyFree] = useState(false)
  const [filterPanelOpen, setFilterPanelOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set(initialFavoriteIds))
  const [poppedId, setPoppedId] = useState<string | null>(null)
  const [searchFocused, setSearchFocused] = useState(false)
  const supabase = createClient()
  const filterRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setPage(1) }, [filter, sort, search, minPrice, maxPrice, onlyWithImage, onlyFree])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterPanelOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const activeAdvancedCount = [minPrice, maxPrice, onlyWithImage, onlyFree].filter(Boolean).length
  const activeFilterCount = activeAdvancedCount + (filter !== 'all' ? 1 : 0) + (sort !== 'newest' ? 1 : 0)

  function resetAllFilters() {
    setFilter('all'); setSort('newest'); setMinPrice(''); setMaxPrice(''); setOnlyWithImage(false); setOnlyFree(false)
  }

  async function toggleFavorite(e: React.MouseEvent, postId: string) {
    e.preventDefault()
    e.stopPropagation()
    const isFav = favoriteIds.has(postId)
    setFavoriteIds(prev => {
      const next = new Set(prev)
      isFav ? next.delete(postId) : next.add(postId)
      return next
    })
    setPoppedId(postId)
    setTimeout(() => setPoppedId(prev => (prev === postId ? null : prev)), 400)
    if (isFav) {
      await supabase.from('favorites').delete().eq('user_id', currentUserId).eq('post_id', postId)
    } else {
      await supabase.from('favorites').insert({ user_id: currentUserId, post_id: postId })
    }
  }

  const searchSuggestions = search.trim().length > 0
    ? posts.filter(p => p.title.toLowerCase().includes(search.trim().toLowerCase())).slice(0, 6)
    : []

  let filtered = posts
  if (filter !== 'all') filtered = filtered.filter(p => p.category === filter)
  if (search) filtered = filtered.filter(p => p.title.toLowerCase().includes(search.toLowerCase()))
  if (onlyFree) filtered = filtered.filter(p => p.price === 0)
  if (onlyWithImage) filtered = filtered.filter(p => !!p.image_url)
  if (minPrice) filtered = filtered.filter(p => p.price >= parseFloat(minPrice))
  if (maxPrice) filtered = filtered.filter(p => p.price <= parseFloat(maxPrice))
  if (sort === 'price_asc')  filtered = [...filtered].sort((a, b) => a.price - b.price)
  if (sort === 'price_desc') filtered = [...filtered].sort((a, b) => b.price - a.price)
  if (sort === 'newest') filtered = [...filtered].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const visible = filtered.slice(0, page * PAGE_SIZE)
  const hasMore = visible.length < filtered.length

  return (
    <>
      <div className="postgrid-toolbar-row" style={{ display: 'flex', gap: '8px', marginBottom: '20px', position: 'relative', zIndex: 30 }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '140px' }}>
          <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', display: 'flex', color: 'var(--text-faint)', pointerEvents: 'none' }}>
            <SearchIcon size={15} />
          </span>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 120)}
            placeholder="Artikel suchen..."
            style={{ width: '100%', height: '44px', background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '999px', padding: '0 16px 0 42px', fontSize: '14px', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box', boxShadow: 'var(--shadow-xs)' }} />

          {searchFocused && searchSuggestions.length > 0 && (
            <div className="dropdown-pop" style={{ position: 'absolute', top: '50px', left: 0, right: 0, background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', boxShadow: 'var(--shadow-lg)', zIndex: 1000, overflow: 'hidden' }}>
              {searchSuggestions.map(s => (
                <div key={s.id} className="nav-menu-item" onMouseDown={() => setSearch(s.title)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', padding: '9px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border-light)' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</span>
                  <span style={{ fontSize: '12px', color: s.price === 0 ? 'var(--state-success)' : 'var(--text-muted)', fontWeight: 600, flexShrink: 0 }}>
                    {s.price === 0 ? 'Verschenkt' : `${s.price.toFixed(2)} €`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div ref={filterRef} style={{ position: 'relative', flexShrink: 0 }}>
          <button onClick={() => setFilterPanelOpen(!filterPanelOpen)} className="filter-btn-modern"
            style={{
              position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '44px', height: '44px', boxSizing: 'border-box', flexShrink: 0,
              background: filterPanelOpen ? 'var(--color-primary)' : 'var(--bg-card)',
              border: `1px solid ${filterPanelOpen ? 'var(--color-primary)' : 'var(--border-light)'}`,
              color: filterPanelOpen ? 'var(--text-on-dark)' : 'var(--text-secondary)',
              borderRadius: '50%', cursor: 'pointer', boxShadow: 'var(--shadow-xs)'
            }}>
            <FilterIcon size={16} />
            {activeFilterCount > 0 && (
              <span style={{ position: 'absolute', top: '-3px', right: '-3px', background: 'var(--color-accent)', color: 'var(--text-on-dark)', fontSize: '10px', fontWeight: 700, borderRadius: '999px', minWidth: '16px', height: '16px', padding: '0 3px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--bg-page)' }}>
                {activeFilterCount}
              </span>
            )}
          </button>

          {filterPanelOpen && (
            <div className="dropdown-pop" style={{ position: 'absolute', top: '52px', right: 0, width: 'min(320px, calc(100vw - 32px))', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '14px', boxShadow: 'var(--shadow-lg)', zIndex: 100, padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '8px' }}>Sortierung</label>
                <select value={sort} onChange={e => setSort(e.target.value)}
                  style={{ width: '100%', height: '38px', background: 'var(--bg-page)', border: '1px solid var(--border-input)', borderRadius: '6px', padding: '0 12px', fontSize: '13px', color: 'var(--text-primary)', outline: 'none', cursor: 'pointer', boxSizing: 'border-box' }}>
                  <option value="newest">Neueste</option>
                  <option value="price_asc">Preis aufsteigend</option>
                  <option value="price_desc">Preis absteigend</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '8px' }}>Kategorie</label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {['all', 'calculator', 'lfs_shirt', 'clothing', 'notebook', 'lecture', 'supplies', 'other'].map(cat => (
                    <button key={cat} onClick={() => setFilter(cat)} className="filter-btn-modern"
                      style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                        height: '30px', boxSizing: 'border-box',
                        background: filter === cat ? 'var(--color-primary)' : 'var(--bg-page)',
                        border: `1px solid ${filter === cat ? 'var(--color-primary)' : 'var(--border-input)'}`,
                        color: filter === cat ? 'var(--text-on-dark)' : 'var(--text-secondary)',
                        fontSize: '12px', padding: '0 12px',
                        borderRadius: '999px', cursor: 'pointer', whiteSpace: 'nowrap'
                      }}>
                      {cat !== 'all' && <CategoryIcon category={cat} size={12} color={filter === cat ? 'var(--text-on-dark)' : 'var(--text-muted)'} />}
                      {cat === 'all' ? 'Alle' : categoryLabel[cat]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '8px' }}>Preis</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type="number" value={minPrice} onChange={e => setMinPrice(e.target.value)}
                    placeholder="von €" min="0" style={{ width: '100%', background: 'var(--bg-page)', border: '1px solid var(--border-input)', borderRadius: '6px', padding: '8px 10px', fontSize: '13px', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }} />
                  <input type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)}
                    placeholder="bis €" min="0" style={{ width: '100%', background: 'var(--bg-page)', border: '1px solid var(--border-input)', borderRadius: '6px', padding: '8px 10px', fontSize: '13px', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={onlyWithImage} onChange={e => setOnlyWithImage(e.target.checked)} style={{ width: '15px', height: '15px', cursor: 'pointer' }} />
                  Nur mit Bild
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '13px', color: 'var(--state-success)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={onlyFree} onChange={e => setOnlyFree(e.target.checked)} style={{ width: '15px', height: '15px', cursor: 'pointer' }} />
                  Nur zu verschenken
                </label>
              </div>

              {activeFilterCount > 0 && (
                <button onClick={resetAllFilters}
                  style={{ fontSize: '12px', color: 'var(--text-muted)', background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer', textAlign: 'left', padding: 0 }}>
                  Alle Filter zurücksetzen
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <p style={{ fontSize: '14px', color: 'var(--text-faint)' }}>Keine Inserate gefunden.</p>
        </div>
      )}

      <div className="grid-mobile" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '18px' }}>
        {visible.map((post, i) => {
          const catStyle = Object.fromEntries(
            CATEGORY_TAG_STYLE.split(';').filter(Boolean).map(s => s.split(':'))
          )
          const isFav = favoriteIds.has(post.id)
          return (
            <Link key={post.id} href={`/post/${post.id}`} className="post-card-modern"
              style={{ animationDelay: `${Math.min(i, 12) * 60}ms`, textDecoration: 'none', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden', display: 'block' }}>
              <div className="post-image-modern" style={{ aspectRatio: '4/3', background: CATEGORY_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                {post.image_url
                  ? <img src={post.image_url} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <CategoryIcon category={post.category} size={36} color="var(--text-faint)" />
                }
                <span style={{ position: 'absolute', top: '8px', left: '8px', fontSize: '10px', fontWeight: 500, padding: '3px 8px', borderRadius: '3px', ...catStyle }}>
                  {categoryLabel[post.category]}
                </span>
                <button onClick={e => toggleFavorite(e, post.id)} className="icon-btn-modern"
                  style={{ position: 'absolute', top: '8px', right: '8px', width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(var(--color-bg-rgb),0.9)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isFav ? 'var(--color-accent)' : 'var(--text-faint)', zIndex: 10 }}>
                  <span className={poppedId === post.id ? 'icon-pop' : ''} style={{ display: 'flex' }}>
                    <HeartIcon size={14} filled={isFav} />
                  </span>
                </button>
              </div>
              <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border-light)' }}>
                <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{post.title}</p>
                <p style={{ fontSize: '11px', color: 'var(--text-faint)', marginBottom: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{post.description}</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                  {post.price === 0
                    ? <span className="post-price-modern" style={{ fontSize: '11px', fontWeight: 600, color: 'var(--state-success)', background: 'var(--state-success-bg)', padding: '3px 8px', borderRadius: '4px', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>Verschenken</span>
                    : <span className="post-price-modern" style={{ fontSize: '15px', fontWeight: 500, color: 'var(--color-primary)', flexShrink: 0 }}>{post.price.toFixed(2)} €</span>
                  }
                  <span style={{ fontSize: '10px', color: 'var(--text-faint)', background: 'var(--bg-page)', padding: '2px 7px', borderRadius: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.profiles?.display_name || post.profiles?.username}</span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {hasMore && (
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button onClick={() => setPage(p => p + 1)} className="btn-modern"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-input)', color: 'var(--color-primary)', fontSize: '13px', fontWeight: 500, borderRadius: '6px', padding: '10px 22px', cursor: 'pointer' }}>
            Mehr laden ({filtered.length - visible.length} weitere)
          </button>
        </div>
      )}
    </>
  )
}