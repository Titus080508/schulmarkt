// Alle Kategorien teilen sich denselben Farb-Stil (60/30/10-Schema) -
// Unterscheidung erfolgt nur noch über CategoryIcon, nicht über Farbe.
export const CATEGORY_TAG_STYLE = 'background:var(--tag-bg);color:var(--tag-color)'
export const CATEGORY_BG = 'var(--tag-bg)'

// Platzhalter fuer Posts ohne Bild: heller Verlauf statt flacher Flaeche,
// mit leicht variierendem Winkel pro Kategorie fuer etwas Abwechslung im
// Grid - bleibt aber innerhalb der vorhandenen zwei Farbtoene (kein neuer Hue).
const placeholderAngles: Record<string, number> = {
  calculator: 135, lfs_shirt: 150, clothing: 120, notebook: 145,
  lecture: 125, supplies: 155, other: 140
}

export function categoryPlaceholderBg(category: string) {
  const angle = placeholderAngles[category] ?? 135
  return `linear-gradient(${angle}deg, var(--bg-card) 0%, var(--tag-bg) 100%)`
}

// Dezente Deckkraft fuer das grosse Kategorie-Icon im Platzhalter - gross
// genug um als Gestaltungselement zu wirken, aber bewusst zurueckhaltend.
export const CATEGORY_ICON_OPACITY = 0.34
