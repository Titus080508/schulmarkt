import Link from 'next/link'

export default function DatenschutzPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)', padding: '40px 20px' }}>
      <div style={{ maxWidth: '700px', margin: '0 auto', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '36px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#1a3a6e', marginBottom: '8px' }}>Datenschutzerklärung</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-faint)', marginBottom: '24px' }}>Stand: Juni 2026</p>

        <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '24px', marginBottom: '8px' }}>1. Verantwortliche Stelle</h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          Verantwortlich für die Datenverarbeitung auf dieser Plattform ist die Erzbischöfliche
          Liebfrauenschule Köln. Als kirchliche Einrichtung unterliegt der Betrieb dieser Plattform
          dem Kirchlichen Datenschutzgesetz (KDG) statt der DSGVO. Aufsichtsbehörde ist das
          Katholische Datenschutzzentrum (KDSA). Kontaktmöglichkeiten findest du unter Punkt 8.
        </p>

        <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '24px', marginBottom: '8px' }}>2. Welche Daten werden verarbeitet?</h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          Bei der Nutzung des Schulmarktplatzes verarbeiten wir folgende Daten:
        </p>
        <ul style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.8, paddingLeft: '20px' }}>
          <li>Benutzername und Anzeigename (über den Schul-Login bzw. bei der Registrierung angegeben)</li>
          <li>Von dir veröffentlichte Inserate, einschließlich Titel, Beschreibung, Preis und Bilder</li>
          <li>Private Nachrichten und Preisangebote zwischen Nutzerinnen und Nutzern</li>
          <li>Favoriten und Mitteilungen (Benachrichtigungen)</li>
          <li>Meldungen zu Inseraten oder Nutzern, inklusive des angegebenen Grundes</li>
          <li>Technische Daten zur Anmeldung (z. B. Sitzungs-Cookie zur Authentifizierung)</li>
        </ul>

        <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '24px', marginBottom: '8px' }}>3. Zweck der Verarbeitung</h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          Die Daten werden ausschließlich verarbeitet, um den Schulmarktplatz als internen
          Marktplatz für Schülerinnen und Schüler der LFS Köln bereitzustellen: Anzeige und
          Verwaltung von Inseraten, Kommunikation zwischen Käufer und Verkäufer sowie Moderation
          (Bearbeitung von Meldungen, Sperrung bei Regelverstößen).
        </p>

        <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '24px', marginBottom: '8px' }}>4. Speicherdauer</h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          Inserate werden nach dem Löschen für 48 Stunden zwischengespeichert und anschließend
          endgültig entfernt. Nachrichten, Profil- und Kontodaten bleiben gespeichert, solange der
          Account besteht. Bei Wunsch auf vollständige Löschung deines Accounts wende dich an die
          unten genannte Kontaktadresse.
        </p>

        <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '24px', marginBottom: '8px' }}>5. Weitergabe an Dritte</h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          Zum Betrieb der Plattform wird der Dienstleister Supabase (Datenbank- und Authentifizierungs-Hosting)
          als Auftragsverarbeiter eingesetzt. Eine Weitergabe an sonstige Dritte oder zu Werbezwecken
          findet nicht statt.
        </p>

        <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '24px', marginBottom: '8px' }}>6. Cookies</h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          Diese Plattform verwendet ausschließlich technisch notwendige Cookies, die für die Anmeldung
          und Aufrechterhaltung deiner Sitzung erforderlich sind. Es werden keine Tracking- oder
          Werbe-Cookies eingesetzt.
        </p>

        <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '24px', marginBottom: '8px' }}>7. Deine Rechte</h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          Du hast das Recht auf Auskunft, Berichtigung, Löschung und Einschränkung der Verarbeitung
          deiner Daten. Wende dich dazu an die unten genannte Kontaktadresse.
        </p>

        <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '24px', marginBottom: '8px' }}>8. Kontakt</h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          Bei Fragen zum Datenschutz wende dich an{' '}
          <a href="mailto:tituskullmann@icloud.com" className="link-modern" style={{ color: '#1a3a6e' }}>
            tituskullmann@icloud.com
          </a>.
        </p>

        <Link href="/dashboard" className="link-modern" style={{ display: 'inline-block', marginTop: '28px', fontSize: '13px', color: '#1a3a6e', fontWeight: 500 }}>
          ← Zurück
        </Link>
      </div>
    </div>
  )
}
