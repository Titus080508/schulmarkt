import Link from 'next/link'

export default function NutzungsbedingungenPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)', padding: '40px 20px' }}>
      <div style={{ maxWidth: '700px', margin: '0 auto', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '36px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#1a3a6e', marginBottom: '24px' }}>Nutzungsbedingungen</h1>

        <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '24px', marginBottom: '8px' }}>1. Geltungsbereich</h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          Diese Nutzungsbedingungen gelten für alle Nutzerinnen und Nutzer des Schulmarktplatzes
          „LFS Kleinanzeigen". Die Plattform steht ausschließlich Schülerinnen und Schülern der
          Erzbischöflichen Liebfrauenschule Köln zur Verfügung und ist über den Schul-Account
          erreichbar.
        </p>

        <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '24px', marginBottom: '8px' }}>2. Rolle des Betreibers</h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          Die Plattform vermittelt lediglich den Kontakt zwischen Käufer und Verkäufer. Kaufverträge
          kommen ausschließlich zwischen den Nutzerinnen und Nutzern selbst zustande. Der Betreiber
          ist an diesen Verträgen nicht beteiligt und übernimmt keine Haftung für Inhalt, Qualität,
          Echtheit oder Bezahlung der angebotenen Artikel.
        </p>

        <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '24px', marginBottom: '8px' }}>3. Pflichten bei der Erstellung von Inseraten</h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          Inserate müssen wahrheitsgemäß sein. Verboten sind insbesondere: rechtswidrige, gefährliche
          oder altersbeschränkte Artikel, Beleidigungen oder diskriminierende Inhalte sowie Spam.
          Verstöße können über die Melde-Funktion gemeldet werden und führen zur Entfernung des
          Inserats und ggf. zur Sperrung des Accounts.
        </p>

        <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '24px', marginBottom: '8px' }}>4. Verhalten gegenüber anderen Nutzern</h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          Im Chat und bei Preisverhandlungen ist ein respektvoller Umgang erforderlich. Auch hierfür
          steht eine Melde-Funktion für Nutzer zur Verfügung.
        </p>

        <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '24px', marginBottom: '8px' }}>5. Bilder und Urheberrecht</h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          Nutzerinnen und Nutzer sind selbst dafür verantwortlich, dass sie die Rechte an den von
          ihnen hochgeladenen Bildern besitzen.
        </p>

        <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '24px', marginBottom: '8px' }}>6. Sperrung und Account-Maßnahmen</h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          Bei wiederholten oder schweren Verstößen gegen diese Nutzungsbedingungen kann ein Account
          durch die Administration gesperrt werden.
        </p>

        <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '24px', marginBottom: '8px' }}>7. Datenschutz</h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          Informationen zur Verarbeitung deiner Daten findest du in der{' '}
          <Link href="/datenschutz" className="link-modern" style={{ color: '#1a3a6e' }}>Datenschutzerklärung</Link>.
        </p>

        <Link href="/dashboard" className="link-modern" style={{ display: 'inline-block', marginTop: '28px', fontSize: '13px', color: '#1a3a6e', fontWeight: 500 }}>
          ← Zurück
        </Link>
      </div>
    </div>
  )
}
