import Link from 'next/link'

export default function ImpressumPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)', padding: '40px 20px' }}>
      <div style={{ maxWidth: '700px', margin: '0 auto', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '36px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#1a3a6e', marginBottom: '24px' }}>Impressum</h1>

        <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '24px', marginBottom: '8px' }}>Angaben gemäß § 5 DDG</h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          Erzbischöfliche Liebfrauenschule Köln
        </p>

        <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '24px', marginBottom: '8px' }}>Kontakt</h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          E-Mail:{' '}
          <a href="mailto:tituskullmann@icloud.com" className="link-modern" style={{ color: '#1a3a6e' }}>
            tituskullmann@icloud.com
          </a>
        </p>

        <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '24px', marginBottom: '8px' }}>Verantwortlich für den Inhalt dieser Plattform</h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          Titus Kullmann (technische Umsetzung und Betrieb)<br />
          im Auftrag der Erzbischöflichen Liebfrauenschule Köln
        </p>

        <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '24px', marginBottom: '8px' }}>Hinweis zu Nutzerinhalten</h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          Die auf dieser Plattform veröffentlichten Inserate werden von den Nutzerinnen und Nutzern
          selbst erstellt. Für die Richtigkeit und Rechtmäßigkeit dieser Inhalte sind die jeweiligen
          Ersteller verantwortlich. Rechtsverstöße können über die Melde-Funktion bei einem Inserat
          gemeldet werden und werden danach geprüft.
        </p>

        <Link href="/dashboard" className="link-modern" style={{ display: 'inline-block', marginTop: '28px', fontSize: '13px', color: '#1a3a6e', fontWeight: 500 }}>
          ← Zurück
        </Link>
      </div>
    </div>
  )
}
