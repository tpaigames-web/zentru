import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { LocalNotifications } from '@capacitor/local-notifications'
import { Capacitor } from '@capacitor/core'

/**
 * Listen for notification taps and navigate to the appropriate page.
 * - Quick entry notification (id 8888) → /transactions/new
 * - Payment reminders → /cards
 * - Daily reminder (id 9999) → /transactions/new
 */
export function useNotificationNavigation() {
  const navigate = useNavigate()

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return

    const listener = LocalNotifications.addListener(
      'localNotificationActionPerformed',
      (event) => {
        const notif = event.notification

        // Check for custom route in extra data
        if (notif.extra?.route) {
          navigate(notif.extra.route)
          return
        }

        // Quick entry persistent notification
        if (notif.id === 8888) {
          navigate('/transactions/new')
          return
        }

        // Daily reminder
        if (notif.id === 9999) {
          navigate('/transactions/new')
          return
        }

        // Payment reminders (id 1-100)
        if (notif.id >= 1 && notif.id <= 100) {
          navigate('/cards')
          return
        }

        // Default: go to dashboard
        navigate('/')
      },
    )

    return () => {
      listener.then((l) => l.remove())
    }
  }, [navigate])
}
