import Link from 'next/link'

export default function Footer() {
  return (
    <footer style={{ background: '#1a3a6e', padding: '20px', textAlign: 'center', marginTop: 'auto' }}>
      <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>
        LFS Kleinanzeigen — Erzb. Liebfrauenschule Köln
      </p>
      <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
        Bei Fragen und Anmerkungen bitte eine E-Mail an{' '}
        <a href="mailto:tituskullmann@icloud.com" className="link-modern"
          style={{ color: '#f0c040', textDecoration: 'none' }}>
          tituskullmann@icloud.com
        </a>{' '}
        schreiben.
      </p>
      <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '8px' }}>
        <Link href="/impressum" className="link-modern" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>
          Impressum
        </Link>
        {' · '}
        <Link href="/datenschutz" className="link-modern" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>
          Datenschutzerklärung
        </Link>
        {' · '}
        <Link href="/nutzungsbedingungen" className="link-modern" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>
          Nutzungsbedingungen
        </Link>
      </p>
    </footer>
  )
}