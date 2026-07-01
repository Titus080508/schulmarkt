'use client'
import { useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
}

export default function PushNotificationManager() {
  const supabase = createClient()

  useEffect(() => {
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    if (!vapidKey || !('serviceWorker' in navigator) || !('PushManager' in window)) return

    async function subscribe() {
      if (Notification.permission === 'denied') return

      const registration = await navigator.serviceWorker.register('/sw.js')

      if (Notification.permission !== 'granted') {
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') return
      }

      let subscription = await registration.pushManager.getSubscription()
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey)
        })
      }

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: subscription.toJSON() })
      })
    }

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) subscribe()
    })
  }, [])

  return null
}
