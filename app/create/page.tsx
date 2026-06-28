'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import Navbar from '@/components/Navbar'
import PostPreview from '@/components/PostPreview'
import { compressImage } from '@/utils/compressImage'
import CategoryIcon from '@/components/CategoryIcon'

const inputStyle = { width: '100%', background: 'var(--bg-page)', border: '1px solid var(--border-input)', borderRadius: '6px', padding: '10px 14px', color: 'var(--text-primary)', fontSize: '14px', outline: 'none', boxSizing: 'border-box' as const }
const labelStyle = { fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: 500 as const }
const selectStyle = {
  ...inputStyle,
  cursor: 'pointer',
  appearance: 'none' as const,
  WebkitAppearance: 'none' as const,
  MozAppearance: 'none' as const,
  paddingRight: '34px',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23999999' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 12px center'
}
const sectionStyle = { background: 'var(--bg-page)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column' as const, gap: '12px' }
const sectionTitleStyle = { fontSize: '11px', fontWeight: 700, color: '#1a3a6e', textTransform: 'uppercase' as const, letterSpacing: '0.06em', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }

export default function CreatePostPage() {
  const [title, setTitle]           = useState('')
  const [desc, setDesc]             = useState('')
  const [price, setPrice]           = useState('')
  const [isFree, setIsFree]         = useState(false)
  const [showFreeHint, setShowFreeHint] = useState(false)
  const [category, setCategory]     = useState('calculator')
  const [images, setImages]         = useState<File[]>([])
  const [previews, setPreviews]     = useState<string[]>([])
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')

  // Taschenrechner
  const [akkuKap, setAkkuKap]           = useState('')
  const [zustand, setZustand]           = useState('')
  const [gravur, setGravur]             = useState('')
  const [calcCase, setCalcCase]         = useState('')
  const [zubehoer, setZubehoer]         = useState('')
  const [kaufjahr, setKaufjahr]         = useState('')

  // LFS Sportshirt
  const [geschlecht, setGeschlecht]     = useState('')
  const [groesse, setGroesse]           = useState('')
  const [shirtZustand, setShirtZustand] = useState('')

  // Klamotten
  const [kleidungTyp, setKleidungTyp]   = useState('')
  const [kleidungGroesse, setKleidungGroesse] = useState('')
  const [kleidungZustand, setKleidungZustand] = useState('')
  const [kleidungFarbe, setKleidungFarbe] = useState('')

  // Schulhefte
  const [heftFach, setHeftFach]         = useState('')
  const [heftZustand, setHeftZustand]   = useState('')
  const [heftBeschrieben, setHeftBeschrieben] = useState('')

  // Lektüren
  const [lektuereTitel, setLektuereTitel] = useState('')
  const [lektuereFach, setLektuereFach]   = useState('')
  const [lektuerenZustand, setLektuerenZustand] = useState('')
  const [lektuereBeschrieben, setLektuereBeschrieben] = useState('')

  // Schulzubehör
  const [zubehoerTyp, setZubehoerTyp]   = useState('')
  const [zubehoerZustand, setZubehoerZustand] = useState('')

  const router = useRouter()
  const supabase = createClient()

  async function handleImages(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (files.length + images.length > 5) { setError('Maximal 5 Bilder erlaubt'); return }
    const compressed = await Promise.all(files.map(f => compressImage(f)))
    setImages(prev => [...prev, ...compressed])
    setPreviews(prev => [...prev, ...compressed.map(f => URL.createObjectURL(f))])
  }

  function removeImage(index: number) {
    setImages(prev => prev.filter((_, i) => i !== index))
    setPreviews(prev => prev.filter((_, i) => i !== index))
  }

  function handlePriceChange(value: string) {
    setPrice(value)
    const num = parseFloat(value)
    setShowFreeHint(!isFree && value !== '' && !isNaN(num) && num > 0 && num < 0.5)
  }

  async function handleCreate() {
    if (!title || (!isFree && !price)) { setError('Titel und Preis sind Pflichtfelder'); return }
    setLoading(true); setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const uploadedUrls: string[] = []
    for (const image of images) {
      const fileExt = image.name.split('.').pop()
      const filePath = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`
      const { error: uploadError } = await supabase.storage.from('post-images').upload(filePath, image)
      if (uploadError) { setError('Bild konnte nicht hochgeladen werden'); setLoading(false); return }
      const { data: urlData } = supabase.storage.from('post-images').getPublicUrl(filePath)
      uploadedUrls.push(urlData.publicUrl)
    }

    const extras =
      category === 'calculator' ? { akkuKap, zustand, gravur, calcCase, zubehoer, kaufjahr } :
      category === 'lfs_shirt'  ? { geschlecht, groesse, shirtZustand } :
      category === 'clothing'   ? { kleidungTyp, kleidungGroesse, kleidungZustand, kleidungFarbe } :
      category === 'notebook'   ? { heftFach, heftZustand, heftBeschrieben } :
      category === 'lecture'    ? { lektuereTitel, lektuereFach, lektuerenZustand, lektuereBeschrieben } :
      category === 'supplies'   ? { zubehoerTyp, zubehoerZustand } : {}

    const { data: post, error: insertError } = await supabase.from('posts').insert({
      title, description: desc, price: isFree ? 0 : parseFloat(price),
      category, seller_id: user.id,
      image_url: uploadedUrls[0] || null,
      extras: JSON.stringify(extras)
    }).select().single()

    if (insertError || !post) { setError(insertError?.message || 'Fehler'); setLoading(false); return }

    if (uploadedUrls.length > 1) {
      await supabase.from('post_images').insert(
        uploadedUrls.map((url, i) => ({ post_id: post.id, url, position: i }))
      )
    }

    router.push('/dashboard')
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
      <Navbar />
      <main style={{ maxWidth: '820px', margin: '0 auto', padding: '24px 20px' }}>
        <h1 style={{ fontSize: '21px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>Artikel inserieren</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>Fülle die Details aus — rechts siehst du eine Live-Vorschau.</p>

        <div className="create-layout" style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, minWidth: 0 }}>

          <div>
            <label style={labelStyle}>Titel *</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} placeholder="z.B. TI-84 Plus" />
          </div>

          <div>
            <label style={labelStyle}>Kategorie</label>
            <select value={category} onChange={e => setCategory(e.target.value)} style={selectStyle}>
              <option value="calculator">Taschenrechner</option>
              <option value="lfs_shirt">LFS Sportshirt</option>
              <option value="clothing">Klamotten</option>
              <option value="notebook">Schulhefte</option>
              <option value="lecture">Lektüren</option>
              <option value="supplies">Schulzubehör</option>
              <option value="other">Sonstiges</option>
            </select>
          </div>

          {category === 'calculator' && (
            <div style={sectionStyle}>
              <p style={sectionTitleStyle}><CategoryIcon category="calculator" size={13} />Taschenrechner Details</p>
              <div><label style={labelStyle}>Akkukapazität</label>
                <select value={akkuKap} onChange={e => setAkkuKap(e.target.value)} style={selectStyle}>
                  <option value="">Bitte wählen...</option>
                  <option>Neu</option><option>Nahezu Neu</option><option>Ausreichend</option><option>Mangelhaft</option>
                </select>
              </div>
              <div><label style={labelStyle}>Sonstiger Zustand</label>
                <select value={zustand} onChange={e => setZustand(e.target.value)} style={selectStyle}>
                  <option value="">Bitte wählen...</option>
                  <option>Makellos</option><option>Leichte Gebrauchsspuren</option><option>Starke Gebrauchsspuren</option>
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><label style={labelStyle}>Gravur?</label>
                  <select value={gravur} onChange={e => setGravur(e.target.value)} style={selectStyle}>
                    <option value="">Bitte wählen...</option><option>Ja</option><option>Nein</option>
                  </select>
                </div>
                <div><label style={labelStyle}>Case?</label>
                  <select value={calcCase} onChange={e => setCalcCase(e.target.value)} style={selectStyle}>
                    <option value="">Bitte wählen...</option><option>Ja</option><option>Nein</option>
                  </select>
                </div>
              </div>
              <div><label style={labelStyle}>Zubehör vorhanden?</label>
                <select value={zubehoer} onChange={e => setZubehoer(e.target.value)} style={selectStyle}>
                  <option value="">Bitte wählen...</option>
                  <option>Ja (Ladekabel + Verbindungskabel)</option><option>Nein</option>
                </select>
              </div>
              <div><label style={labelStyle}>Gekauft im Jahr</label>
                <input type="number" value={kaufjahr} onChange={e => setKaufjahr(e.target.value)} style={inputStyle} placeholder="z.B. 2022" min="2000" max="2026" />
              </div>
            </div>
          )}

          {category === 'lfs_shirt' && (
            <div style={sectionStyle}>
              <p style={sectionTitleStyle}><CategoryIcon category="lfs_shirt" size={13} />LFS Sportshirt Details</p>
              <div><label style={labelStyle}>Geschlecht</label>
                <select value={geschlecht} onChange={e => setGeschlecht(e.target.value)} style={selectStyle}>
                  <option value="">Bitte wählen...</option>
                  <option>Männlich</option><option>Weiblich</option>
                </select>
              </div>
              <div><label style={labelStyle}>Größe</label>
                <select value={groesse} onChange={e => setGroesse(e.target.value)} style={selectStyle}>
                  <option value="">Bitte wählen...</option>
                  <option>XS</option><option>S</option><option>M</option><option>L</option><option>XL</option><option>XXL</option>
                </select>
              </div>
              <div><label style={labelStyle}>Zustand</label>
                <select value={shirtZustand} onChange={e => setShirtZustand(e.target.value)} style={selectStyle}>
                  <option value="">Bitte wählen...</option>
                  <option>Neu / Ungetragen</option><option>Wie Neu</option><option>Guter Zustand</option><option>Gebraucht</option>
                </select>
              </div>
            </div>
          )}

          {category === 'clothing' && (
            <div style={sectionStyle}>
              <p style={sectionTitleStyle}><CategoryIcon category="clothing" size={13} />Klamotten Details</p>
              <div><label style={labelStyle}>Art der Kleidung</label>
                <select value={kleidungTyp} onChange={e => setKleidungTyp(e.target.value)} style={selectStyle}>
                  <option value="">Bitte wählen...</option>
                  <option>T-Shirt</option><option>Hoodie / Pullover</option><option>Jacke</option>
                  <option>Hose</option><option>Shorts</option><option>Schuhe</option><option>Sonstiges</option>
                </select>
              </div>
              <div><label style={labelStyle}>Größe</label>
                <select value={kleidungGroesse} onChange={e => setKleidungGroesse(e.target.value)} style={selectStyle}>
                  <option value="">Bitte wählen...</option>
                  <option>XS</option><option>S</option><option>M</option><option>L</option><option>XL</option><option>XXL</option>
                  <option>36</option><option>38</option><option>40</option><option>42</option><option>44</option>
                </select>
              </div>
              <div><label style={labelStyle}>Zustand</label>
                <select value={kleidungZustand} onChange={e => setKleidungZustand(e.target.value)} style={selectStyle}>
                  <option value="">Bitte wählen...</option>
                  <option>Neu / Ungetragen</option><option>Wie Neu</option><option>Guter Zustand</option><option>Gebraucht</option>
                </select>
              </div>
              <div><label style={labelStyle}>Farbe</label>
                <select value={kleidungFarbe} onChange={e => setKleidungFarbe(e.target.value)} style={selectStyle}>
                  <option value="">Bitte wählen...</option>
                  <option>Weiß</option><option>Schwarz</option><option>Grau</option><option>Blau</option>
                  <option>Navy</option><option>Rot</option><option>Grün</option><option>Gelb</option><option>Sonstige</option>
                </select>
              </div>
            </div>
          )}

          {category === 'notebook' && (
            <div style={sectionStyle}>
              <p style={sectionTitleStyle}><CategoryIcon category="notebook" size={13} />Schulheft Details</p>
              <div><label style={labelStyle}>Fach</label>
                <select value={heftFach} onChange={e => setHeftFach(e.target.value)} style={selectStyle}>
                  <option value="">Bitte wählen...</option>
                  <option>Mathematik</option><option>Deutsch</option><option>Englisch</option><option>Französisch</option>
                  <option>Latein</option><option>Geschichte</option><option>Biologie</option><option>Chemie</option>
                  <option>Physik</option><option>Erdkunde</option><option>Religion</option><option>Sonstiges</option>
                </select>
              </div>
              <div><label style={labelStyle}>Beschrieben?</label>
                <select value={heftBeschrieben} onChange={e => setHeftBeschrieben(e.target.value)} style={selectStyle}>
                  <option value="">Bitte wählen...</option>
                  <option>Nein, leer</option><option>Teilweise beschrieben</option><option>Vollständig beschrieben</option>
                </select>
              </div>
              <div><label style={labelStyle}>Zustand</label>
                <select value={heftZustand} onChange={e => setHeftZustand(e.target.value)} style={selectStyle}>
                  <option value="">Bitte wählen...</option>
                  <option>Wie Neu</option><option>Guter Zustand</option><option>Gebraucht</option>
                </select>
              </div>
            </div>
          )}

          {category === 'lecture' && (
            <div style={sectionStyle}>
              <p style={sectionTitleStyle}><CategoryIcon category="lecture" size={13} />Lektüre Details</p>
              <div><label style={labelStyle}>Titel des Buches</label>
                <input type="text" value={lektuereTitel} onChange={e => setLektuereTitel(e.target.value)} style={inputStyle} placeholder="z.B. Der Vorleser" />
              </div>
              <div><label style={labelStyle}>Fach</label>
                <select value={lektuereFach} onChange={e => setLektuereFach(e.target.value)} style={selectStyle}>
                  <option value="">Bitte wählen...</option>
                  <option>Deutsch</option><option>Englisch</option><option>Französisch</option>
                  <option>Latein</option><option>Geschichte</option><option>Sonstiges</option>
                </select>
              </div>
              <div><label style={labelStyle}>Beschrieben / Markiert?</label>
                <select value={lektuereBeschrieben} onChange={e => setLektuereBeschrieben(e.target.value)} style={selectStyle}>
                  <option value="">Bitte wählen...</option>
                  <option>Nein</option><option>Leicht markiert</option><option>Stark markiert</option>
                </select>
              </div>
              <div><label style={labelStyle}>Zustand</label>
                <select value={lektuerenZustand} onChange={e => setLektuerenZustand(e.target.value)} style={selectStyle}>
                  <option value="">Bitte wählen...</option>
                  <option>Wie Neu</option><option>Guter Zustand</option><option>Gebraucht</option><option>Stark gebraucht</option>
                </select>
              </div>
            </div>
          )}

          {category === 'supplies' && (
            <div style={sectionStyle}>
              <p style={sectionTitleStyle}><CategoryIcon category="supplies" size={13} />Schulzubehör Details</p>
              <div><label style={labelStyle}>Art des Zubehörs</label>
                <select value={zubehoerTyp} onChange={e => setZubehoerTyp(e.target.value)} style={selectStyle}>
                  <option value="">Bitte wählen...</option>
                  <option>Geodreieck / Lineal</option><option>Zirkel</option><option>Taschenrechner-Zubehör</option>
                  <option>Stifte / Marker</option><option>Schulranzen / Tasche</option><option>Mäppchen</option>
                  <option>Ordner / Hefter</option><option>Sonstiges</option>
                </select>
              </div>
              <div><label style={labelStyle}>Zustand</label>
                <select value={zubehoerZustand} onChange={e => setZubehoerZustand(e.target.value)} style={selectStyle}>
                  <option value="">Bitte wählen...</option>
                  <option>Neu</option><option>Wie Neu</option><option>Guter Zustand</option><option>Gebraucht</option>
                </select>
              </div>
            </div>
          )}

          <div>
            <label style={labelStyle}>Preis (€) {!isFree && '*'}</label>
            <input type="number" value={isFree ? '' : price} onChange={e => handlePriceChange(e.target.value)} disabled={isFree}
              style={{ ...inputStyle, opacity: isFree ? 0.5 : 1, cursor: isFree ? 'not-allowed' : 'text' }}
              placeholder={isFree ? 'Wird verschenkt' : '5.00'} min="0" step="0.50" />

            {showFreeHint && (
              <div className="fade-in-up" style={{ marginTop: '8px', background: '#eef2f8', border: '1px solid #c8d4e8', borderRadius: '6px', padding: '10px 12px', fontSize: '12px', color: '#1a3a6e', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '8px' }}>
                <span>Preis unter 0,50 € — möchtest du den Artikel nicht einfach verschenken?</span>
                <button type="button" onClick={() => { setIsFree(true); setShowFreeHint(false); setPrice('') }}
                  className="btn-modern"
                  style={{ background: '#1a3a6e', color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 10px', fontSize: '11px', fontWeight: 500, cursor: 'pointer' }}>
                  Ja, verschenken
                </button>
              </div>
            )}

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <input type="checkbox" checked={isFree}
                onChange={e => { setIsFree(e.target.checked); setShowFreeHint(false); if (e.target.checked) setPrice('') }}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
              Artikel verschenken (kostenlos)
            </label>
          </div>

          <div>
            <label style={labelStyle}>Beschreibung</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={3}
              style={{ ...inputStyle, resize: 'none' }} placeholder="Weitere Infos zum Artikel..." />
          </div>

          <div>
            <label style={labelStyle}>Bilder (max. 5)</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '8px', marginBottom: '8px' }}>
              {previews.map((src, i) => (
                <div key={i} style={{ position: 'relative', aspectRatio: '1', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border-input)' }}>
                  <img src={src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button onClick={() => removeImage(i)}
                    style={{ position: 'absolute', top: '4px', right: '4px', background: '#b91c1c', border: 'none', borderRadius: '4px', padding: '2px 6px', fontSize: '10px', cursor: 'pointer', color: '#fff' }}>
                    ✕
                  </button>
                  {i === 0 && <span style={{ position: 'absolute', bottom: '4px', left: '4px', background: '#1a3a6e', color: '#fff', fontSize: '9px', padding: '2px 5px', borderRadius: '3px' }}>Titelbild</span>}
                </div>
              ))}
              {previews.length < 5 && (
                <div onClick={() => document.getElementById('file-input')?.click()}
                  style={{ aspectRatio: '1', border: '1px dashed #bbb', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'var(--bg-page)', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '20px', color: 'var(--text-faint)' }}>+</span>
                  <span style={{ fontSize: '10px', color: 'var(--text-faint)' }}>Hinzufügen</span>
                </div>
              )}
            </div>
            <input id="file-input" type="file" accept="image/*" multiple onChange={handleImages} style={{ display: 'none' }} />
          </div>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', padding: '10px 14px', fontSize: '13px', color: '#b91c1c' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', paddingTop: '8px', borderTop: '1px solid var(--border-light)' }}>
            <button onClick={() => router.back()} className="btn-modern"
              style={{ flex: 1, background: 'var(--bg-page)', border: '1px solid var(--border-input)', color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 500, borderRadius: '6px', padding: '12px', cursor: 'pointer' }}>
              Abbrechen
            </button>
            <button onClick={handleCreate} disabled={loading} className="btn-modern"
              style={{ flex: 1, background: loading ? '#7a9ab8' : '#1a3a6e', color: '#fff', fontSize: '14px', fontWeight: 600, border: 'none', borderRadius: '6px', padding: '12px', cursor: loading ? 'default' : 'pointer' }}>
              {loading ? 'Wird erstellt...' : 'Veröffentlichen'}
            </button>
          </div>
        </div>

        <div className="create-preview" style={{ position: 'sticky', top: '70px', flexShrink: 0 }}>
          <PostPreview
            title={title}
            description={desc}
            price={price}
            isFree={isFree}
            category={category}
            imagePreview={previews[0]}
            sellerName="Du"
          />
        </div>
        </div>
      </main>
    </div>
  )
}