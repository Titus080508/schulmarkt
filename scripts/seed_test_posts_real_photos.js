// Legt 15 weitere Test-Inserate mit echten (gemeinfreien/CC-lizenzierten) Fotos
// von Wikimedia Commons an, um das Bild-Rendering mit realistischem
// Fotomaterial statt Platzhaltern zu testen.
// Nutzung: node --env-file=.env.local scripts/seed_test_posts_real_photos.js
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

const TEST_EMAIL = 'testverkauf@schulmarkt.de'
const TEST_PASSWORD = 'Test1234!'
const UA = 'SchulmarktDesignTest/1.0 (test data for school marketplace project)'

const posts = [
  { title: 'Wissenschaftlicher Taschenrechner', description: 'Gebrauchter wissenschaftlicher Taschenrechner, alle Funktionen intakt.', price: 9, category: 'calculator',
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Calculator-scientific_%2824218253912%29.jpg/960px-Calculator-scientific_%2824218253912%29.jpg' },
  { title: 'Grafikrechner TI-81', description: 'Älteres Modell, funktioniert einwandfrei, ideal zum Üben.', price: 20, category: 'calculator',
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/TI-81_Calculator_on_Graph_Screen.jpg/960px-TI-81_Calculator_on_Graph_Screen.jpg' },
  { title: 'Poloshirt', description: 'Kaum getragen, gepflegter Zustand.', price: 7, category: 'lfs_shirt',
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Caldera_Systems_polo_shirt_and_T_shirt.jpg/960px-Caldera_Systems_polo_shirt_and_T_shirt.jpg' },
  { title: 'Sport-T-Shirt beige', description: 'Einfaches Sport-Shirt, mehrfach gewaschen aber intakt.', price: 3, category: 'lfs_shirt',
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Beige-t-shirt-front.jpg/960px-Beige-t-shirt-front.jpg' },
  { title: 'Winterjacke kariert', description: 'Warme Winterjacke, auffälliges Karo-Muster.', price: 22, category: 'clothing',
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/Polo_Ralph_Lauren_winter_jacket%2C_red_and_black_plaid.jpg/960px-Polo_Ralph_Lauren_winter_jacket%2C_red_and_black_plaid.jpg' },
  { title: 'Regenjacke gelb', description: 'Klassische gelbe Regenjacke, wasserdicht.', price: 11, category: 'clothing',
    src: 'https://upload.wikimedia.org/wikipedia/commons/2/29/Yellow_Raincoat.jpg' },
  { title: 'Sneaker', description: 'Bequeme Sneaker, leichte Gebrauchsspuren.', price: 16, category: 'clothing',
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Vans_sneakers_and_socks.jpg/960px-Vans_sneakers_and_socks.jpg' },
  { title: 'Wolljacke', description: 'Hochwertige Wolljacke, sehr guter Zustand.', price: 30, category: 'clothing',
    src: 'https://upload.wikimedia.org/wikipedia/commons/7/77/2011_Thom_Browne_jacket%2C_top-stitched_wool%2C_Fall-Winter_03.jpg' },
  { title: 'Notizheft', description: 'Fast unbenutztes Notizheft, kariert.', price: 1.5, category: 'notebook',
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Notebook_writing.jpg/960px-Notebook_writing.jpg' },
  { title: 'Übungsheft', description: 'Übungsheft, wenige Seiten beschrieben.', price: 0, category: 'notebook',
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Jju_Wikipedia_Outreach_Zonkwa_2025_Exercise_BK_Back.jpg/960px-Jju_Wikipedia_Outreach_Zonkwa_2025_Exercise_BK_Back.jpg' },
  { title: 'Taschenbuch-Roman', description: 'Spannender Taschenbuch-Roman, guter Zustand.', price: 3, category: 'lecture',
    src: 'https://upload.wikimedia.org/wikipedia/commons/f/f3/Fleming%27s_paperback_Bonds.jpg' },
  { title: 'Taschenbuch', description: 'Gebrauchtes Taschenbuch, vollständig und lesbar.', price: 2, category: 'lecture',
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Roy_Doliner_paperback_cover_and_course_listing.jpg/960px-Roy_Doliner_paperback_cover_and_course_listing.jpg' },
  { title: 'Geometrie-Set', description: 'Geodreieck-Set aus Klarsichtmaterial, kaum benutzt.', price: 4, category: 'supplies',
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fb/Rumold_1052_geometry_set_square_225_mm_clear.jpg/960px-Rumold_1052_geometry_set_square_225_mm_clear.jpg' },
  { title: 'Geometrie-Etui', description: 'Etui mit vollständigem Geometrie-Zubehör.', price: 5, category: 'supplies',
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Estoig_geom%C3%A8tric.jpg/960px-Estoig_geom%C3%A8tric.jpg' },
  { title: 'Regenmantel (Vintage)', description: 'Ausgefallener Regenmantel im Retro-Stil.', price: 6, category: 'other',
    src: 'https://upload.wikimedia.org/wikipedia/commons/0/0f/Regenmantel_1919.jpg' },
]

async function main() {
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email: TEST_EMAIL, password: TEST_PASSWORD })
  if (signInError) throw signInError
  const userId = signInData.user.id
  console.log('Seller:', userId)

  for (const p of posts) {
    const res = await fetch(p.src, { headers: { 'User-Agent': UA } })
    if (!res.ok) { console.error('Download fehlgeschlagen für', p.title, res.status); continue }
    const buffer = Buffer.from(await res.arrayBuffer())
    const ext = p.src.split('.').pop().split('%').join('').slice(0, 4)
    const filePath = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`

    const { error: uploadError } = await supabase.storage.from('post-images')
      .upload(filePath, buffer, { contentType: 'image/jpeg' })
    if (uploadError) { console.error('Upload fehlgeschlagen für', p.title, '-', uploadError.message); continue }
    const { data: urlData } = supabase.storage.from('post-images').getPublicUrl(filePath)

    const { error } = await supabase.from('posts').insert({
      title: p.title,
      description: p.description,
      price: p.price,
      category: p.category,
      seller_id: userId,
      image_url: urlData.publicUrl,
      extras: JSON.stringify({})
    })
    if (error) console.error('Insert fehlgeschlagen für', p.title, '-', error.message)
    else console.log('Angelegt (echtes Foto):', p.title)
  }
}

main().catch(err => { console.error(err); process.exit(1) })
