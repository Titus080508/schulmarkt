// Einmaliges Skript, um Test-Inserate für die Design-Vorschau anzulegen.
// Nutzung: node --env-file=.env.local scripts/seed_test_posts.js
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

const TEST_EMAIL = 'testverkauf@schulmarkt.de'
const TEST_PASSWORD = 'Test1234!'
const TEST_USERNAME = 'testverkauf'

const posts = [
  { title: 'TI-30X Plus MathPrint', description: 'Schulrechner in gutem Zustand, alle Tasten funktionieren einwandfrei.', price: 12, category: 'calculator', extras: { zustand: 'gut' } },
  { title: 'Casio FX-991DE X', description: 'Kaum benutzt, mit Originalverpackung und Anleitung.', price: 18.5, category: 'calculator', extras: { zustand: 'sehr gut' } },
  { title: 'LFS Sportshirt Gr. M', description: 'Einmal getragen, Farbe Grau/Weiß.', price: 8, category: 'lfs_shirt', extras: { groesse: 'M' } },
  { title: 'LFS Sportshirt Gr. S', description: 'Leichte Gebrauchsspuren, waschbar bis 30 Grad.', price: 0, category: 'lfs_shirt', extras: { groesse: 'S' } },
  { title: 'Winterjacke Gr. 164', description: 'Warme Winterjacke, kaum getragen.', price: 15, category: 'clothing', extras: {} },
  { title: 'Vokabelheft Französisch', description: 'Fast leer, ideal für die 8. Klasse.', price: 2.5, category: 'notebook', extras: {} },
  { title: 'Collegeblock A4 kariert', description: '3er-Pack, unbenutzt.', price: 3, category: 'notebook', extras: {} },
  { title: 'Der Besuch der alten Dame', description: 'Dürrenmatt, Schullektüre, keine Anmerkungen im Buch.', price: 3.5, category: 'lecture', extras: {} },
  { title: 'Faust I', description: 'Reclam-Ausgabe, leicht angegilbt aber vollständig.', price: 0, category: 'lecture', extras: {} },
  { title: 'Geodreieck + Zirkel Set', description: 'Komplettes Geometrie-Set, kaum benutzt.', price: 4, category: 'supplies', extras: {} },
  { title: 'Fülleretui mit Inhalt', description: 'Etui inkl. Füller, Ersatzpatronen und Radierer.', price: 6, category: 'supplies', extras: {} },
  { title: 'Schulranzen (älteres Modell)', description: 'Funktionstüchtig, ein paar Gebrauchsspuren am Boden.', price: 10, category: 'other', extras: {} },
]

async function main() {
  let userId

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: TEST_EMAIL, password: TEST_PASSWORD, options: { data: { username: TEST_USERNAME } }
  })

  if (signUpError) {
    if (!/already registered|already exists/i.test(signUpError.message)) throw signUpError
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email: TEST_EMAIL, password: TEST_PASSWORD })
    if (signInError) throw signInError
    userId = signInData.user.id
  } else {
    userId = signUpData.user.id
  }

  console.log('Seller:', TEST_USERNAME, userId)

  for (const p of posts) {
    const { error } = await supabase.from('posts').insert({
      title: p.title,
      description: p.description,
      price: p.price,
      category: p.category,
      seller_id: userId,
      image_url: null,
      extras: JSON.stringify(p.extras)
    })
    if (error) console.error('FEHLER bei', p.title, '-', error.message)
    else console.log('Angelegt:', p.title)
  }
}

main().catch(err => { console.error(err); process.exit(1) })
