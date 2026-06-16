'use client'
import { useState } from 'react'

interface Props {
  images: string[]
  fallbackBg: string
  fallbackEmoji: string
}

export default function ImageGallery({ images, fallbackBg, fallbackEmoji }: Props) {
  const [current, setCurrent] = useState(0)

  if (images.length === 0) {
    return (
      <div style={{ background: fallbackBg || '#f7f5f0', border: '1px solid #e0dcd4', borderRadius: '10px', aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '80px' }}>
        {fallbackEmoji}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ background: '#f7f5f0', border: '1px solid #e0dcd4', borderRadius: '10px', aspectRatio: '1', overflow: 'hidden', position: 'relative' }}>
        <img src={images[current]} alt="Produktbild" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        {images.length > 1 && (
          <>
            <button
              onClick={() => setCurrent(prev => (prev - 1 + images.length) % images.length)}
              style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.9)', border: '1px solid #ddd', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ‹
            </button>
            <button
              onClick={() => setCurrent(prev => (prev + 1) % images.length)}
              style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.9)', border: '1px solid #ddd', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ›
            </button>
            <div style={{ position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '5px' }}>
              {images.map((_, i) => (
                <div key={i} onClick={() => setCurrent(i)}
                  style={{ width: '7px', height: '7px', borderRadius: '50%', background: i === current ? '#1a3a6e' : 'rgba(255,255,255,0.7)', cursor: 'pointer', border: '1px solid rgba(0,0,0,0.2)' }} />
              ))}
            </div>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto' }}>
          {images.map((src, i) => (
            <div key={i} onClick={() => setCurrent(i)}
              style={{ width: '56px', height: '56px', borderRadius: '6px', overflow: 'hidden', flexShrink: 0, cursor: 'pointer', border: `2px solid ${i === current ? '#1a3a6e' : '#e0dcd4'}` }}>
              <img src={src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}