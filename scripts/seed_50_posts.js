// Legt 50 Test-Inserate ohne Bild an (Icon-Fallback), verteilt über alle Kategorien.
// Nutzung: node --env-file=.env.local scripts/seed_50_posts.js
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

const TEST_EMAIL = 'testverkauf@schulmarkt.de'
const TEST_PASSWORD = 'Test1234!'

const conditions = ['neuwertig', 'guter Zustand', 'leichte Gebrauchsspuren', 'stark gebraucht, funktioniert aber einwandfrei']

function pick(arr, i) { return arr[i % arr.length] }

const templates = [
  { category: 'calculator', items: ['TI-30X Plus MathPrint', 'Casio FX-991DE X', 'TI-84 Plus CE', 'Sharp EL-531', 'HP 300s+', 'Casio FX-85DE Plus'] },
  { category: 'lfs_shirt', items: ['LFS Sportshirt Gr. XS', 'LFS Sportshirt Gr. S', 'LFS Sportshirt Gr. M', 'LFS Sportshirt Gr. L', 'LFS Sportshirt Gr. XL'] },
  { category: 'clothing', items: ['Winterjacke', 'Regenjacke', 'Pullover', 'Sporthose', 'Turnschuhe', 'Mütze', 'Schal'] },
  { category: 'notebook', items: ['Vokabelheft Englisch', 'Vokabelheft Französisch', 'Collegeblock Mathe', 'Heft Biologie', 'Heft Chemie', 'Heft Physik', 'Heft Geschichte'] },
  { category: 'lecture', items: ['Der Besuch der alten Dame', 'Faust I', 'Homo Faber', 'Die Verwandlung', 'Woyzeck', 'Effi Briest', 'Der Steppenwolf'] },
  { category: 'supplies', items: ['Geodreieck-Set', 'Zirkel', 'Federmäppchen gefüllt', 'Textmarker-Set', 'Taschenrechner-Hülle', 'Bleistift-Set'] },
  { category: 'other', items: ['Schulranzen', 'Sporttasche', 'Turnbeutel', 'Regenschirm', 'Trinkflasche', 'Brotdose'] },
]

const posts = []
let n = 0
outer:
for (let round = 0; round < 3; round++) {
  for (const group of templates) {
    for (let i = 0; i < group.items.length; i++) {
      if (n >= 50) break outer
      const item = group.items[(i + round) % group.items.length]
      const condition = pick(conditions, n)
      const free = n % 9 === 0
      posts.push({
        title: round === 0 ? item : `${item} (${round + 1})`,
        description: `${condition}.`,
        price: free ? 0 : Math.round((2 + (n % 12) * 3.5) * 100) / 100,
        category: group.category,
      })
      n++
    }
  }
}

async function main() {
  let userId
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: TEST_EMAIL, password: TEST_PASSWORD, options: { data: { username: 'testverkauf' } }
  })
  if (signUpError) {
    if (!/already registered|already exists/i.test(signUpError.message)) throw signUpError
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email: TEST_EMAIL, password: TEST_PASSWORD })
    if (signInError) throw signInError
    userId = signInData.user.id
  } else {
    userId = signUpData.user.id
  }

  console.log('Seller:', userId, '- lege', posts.length, 'Posts an')

  let ok = 0
  for (const p of posts) {
    const { error } = await supabase.from('posts').insert({
      title: p.title, description: p.description, price: p.price, category: p.category,
      seller_id: userId, image_url: null, extras: JSON.stringify({})
    })
    if (error) console.error('FEHLER bei', p.title, '-', error.message)
    else ok++
  }
  console.log('Erfolgreich angelegt:', ok, '/', posts.length)
}

main().catch(err => { console.error(err); process.exit(1) })
