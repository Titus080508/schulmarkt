import { Client } from 'ldapts'
import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const LDAP_URL = 'ldaps://ldaps.lfs-koeln.logoip.de:636'
const LDAP_BIND_DN = 'cn=ldap-ro,ou=services,dc=lfs-koeln,dc=local'
const LDAP_BIND_PASSWORD = ''
const LDAP_BASE_DN = 'dc=lfs-koeln,dc=local'

export async function POST(request: NextRequest) {
  const { username, password } = await request.json()

  if (!username || !password) {
    return NextResponse.json({ error: 'Bitte alle Felder ausfüllen' }, { status: 400 })
  }

  const client = new Client({ url: LDAP_URL })

  try {
    // Schritt 1: Mit Admin verbinden
    await client.bind(LDAP_BIND_DN, LDAP_BIND_PASSWORD)

    // Schritt 2: Schüler suchen
    const { searchEntries } = await client.search(LDAP_BASE_DN, {
      scope: 'sub',
      filter: `(uid=${username})`,
      attributes: ['dn', 'cn', 'mail', 'uid']
    })

    if (searchEntries.length === 0) {
      return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 401 })
    }

    const userEntry = searchEntries[0]

    // Schritt 3: Mit Schüler-Credentials authentifizieren
    await client.unbind()
    const userClient = new Client({ url: LDAP_URL })
    await userClient.bind(userEntry.dn, password)
    await userClient.unbind()

    // Schritt 4: User in Supabase anlegen oder finden
    const supabase = await createClient()
    const ldapUsername = (userEntry.uid as string) || username

    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', ldapUsername)
      .single()

    if (existingProfile) {
      return NextResponse.json({ success: true, username: ldapUsername, exists: true })
    }

    return NextResponse.json({
      success: true,
      username: ldapUsername,
      displayName: userEntry.cn as string,
      email: userEntry.mail as string,
      exists: false
    })

  } catch (err: any) {
    if (err.message?.includes('Invalid Credentials')) {
      return NextResponse.json({ error: 'Falsches Passwort' }, { status: 401 })
    }
    console.error('LDAP Error:', err)
    return NextResponse.json({ error: 'Login fehlgeschlagen: ' + err.message }, { status: 500 })
  }
}