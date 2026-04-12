import { LocalNotifications } from '@capacitor/local-notifications'
import { Capacitor } from '@capacitor/core'
import type { CreditCard } from '@/models/card'
import { getDaysUntilDue, getNextDueDate } from '@/lib/date'

/**
 * Request notification permission explicitly.
 * Should be called on app startup or when user enables notifications.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (Capacitor.isNativePlatform()) {
    const perm = await LocalNotifications.requestPermissions()
    return perm.display === 'granted'
  }

  // Web fallback
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const result = await Notification.requestPermission()
  return result === 'granted'
}

/**
 * Check if notification permission is granted.
 */
export async function checkNotificationPermission(): Promise<boolean> {
  if (Capacitor.isNativePlatform()) {
    const perm = await LocalNotifications.checkPermissions()
    return perm.display === 'granted'
  }
  return 'Notification' in window && Notification.permission === 'granted'
}

/**
 * Create notification channels (Android 8+).
 * Must be called before scheduling any notifications.
 */
export async function createNotificationChannels() {
  if (!Capacitor.isNativePlatform()) return

  await LocalNotifications.createChannel({
    id: 'payment-reminders',
    name: 'Payment Reminders',
    description: 'Credit card payment due date reminders',
    importance: 5, // MAX
    sound: 'default',
    vibration: true,
  })

  await LocalNotifications.createChannel({
    id: 'daily-reminder',
    name: 'Daily Tracking',
    description: 'Daily expense tracking reminders',
    importance: 3, // DEFAULT
    sound: 'default',
  })

  await LocalNotifications.createChannel({
    id: 'quick-entry',
    name: 'Quick Entry',
    description: 'Persistent notification for quick expense entry',
    importance: 2, // LOW - won't make sound but stays visible
    sound: undefined,
    vibration: false,
  })
}

/**
 * Show persistent notification in status bar for quick entry.
 * Tapping it opens the app to /transactions/new.
 */
export async function showPersistentNotification() {
  if (!Capacitor.isNativePlatform()) return

  await LocalNotifications.schedule({
    notifications: [{
      id: 8888,
      title: '💰 Zentru',
      body: 'Tap to quickly add an expense',
      channelId: 'quick-entry',
      ongoing: true,
      autoCancel: false,
      extra: { route: '/transactions/new' },
    }],
  })
}

/**
 * Remove persistent notification.
 */
export async function hidePersistentNotification() {
  if (!Capacitor.isNativePlatform()) return
  await LocalNotifications.cancel({ notifications: [{ id: 8888 }] })
}

/**
 * Schedule payment due date reminders for all active cards.
 */
export async function schedulePaymentReminders(cards: CreditCard[]) {
  if (!Capacitor.isNativePlatform()) {
    return scheduleWebNotifications(cards)
  }

  const perm = await LocalNotifications.checkPermissions()
  if (perm.display !== 'granted') return

  // Cancel existing payment reminders (IDs 1-100)
  const pending = await LocalNotifications.getPending()
  const paymentNotifs = pending.notifications.filter((n) => n.id >= 1 && n.id <= 100)
  if (paymentNotifs.length > 0) {
    await LocalNotifications.cancel({ notifications: paymentNotifs })
  }

  const notifications = []
  let notifId = 1

  for (const card of cards) {
    if (!card.isActive || card.currentBalance <= 0) continue

    const dueDate = getNextDueDate(card.dueDay)
    const threeDaysBefore = new Date(dueDate)
    threeDaysBefore.setDate(threeDaysBefore.getDate() - 3)

    if (threeDaysBefore > new Date()) {
      notifications.push({
        id: notifId++,
        title: `💳 ${card.name} Payment Due Soon`,
        body: `Payment of RM ${card.currentBalance.toFixed(2)} due in 3 days`,
        schedule: { at: threeDaysBefore },
        channelId: 'payment-reminders',
      })
    }

    if (dueDate > new Date()) {
      notifications.push({
        id: notifId++,
        title: `⚠️ ${card.name} Payment Due Today`,
        body: `Payment of RM ${card.currentBalance.toFixed(2)} is due today!`,
        schedule: { at: dueDate },
        channelId: 'payment-reminders',
      })
    }
  }

  if (notifications.length > 0) {
    await LocalNotifications.schedule({ notifications })
  }
}

/**
 * Schedule daily expense tracking reminder at 9pm.
 */
export async function scheduleDailyReminder() {
  if (!Capacitor.isNativePlatform()) return

  const perm = await LocalNotifications.checkPermissions()
  if (perm.display !== 'granted') return

  const now = new Date()
  const ninepm = new Date(now)
  ninepm.setHours(21, 0, 0, 0)
  if (ninepm <= now) ninepm.setDate(ninepm.getDate() + 1)

  await LocalNotifications.schedule({
    notifications: [{
      id: 9999,
      title: '📝 Time to track expenses',
      body: "Don't forget to log today's spending!",
      schedule: {
        at: ninepm,
        repeats: true,
        every: 'day',
      },
      channelId: 'daily-reminder',
    }],
  })
}

async function scheduleWebNotifications(cards: CreditCard[]) {
  if (!('Notification' in window)) return
  if (Notification.permission !== 'granted') return

  for (const card of cards) {
    if (!card.isActive || card.currentBalance <= 0) continue
    const days = getDaysUntilDue(card.dueDay)

    if (days <= 3 && days >= 0) {
      new Notification(`💳 ${card.name}`, {
        body: days === 0
          ? `Payment of RM ${card.currentBalance.toFixed(2)} is due today!`
          : `Payment of RM ${card.currentBalance.toFixed(2)} due in ${days} days`,
        icon: '/favicon.svg',
      })
    }
  }
}

/**
 * Check and show immediate alerts for cards due soon.
 */
export function getPaymentAlerts(cards: CreditCard[]): { card: CreditCard; daysUntilDue: number }[] {
  return cards
    .filter((c) => c.isActive && c.currentBalance > 0)
    .map((card) => ({ card, daysUntilDue: getDaysUntilDue(card.dueDay) }))
    .filter(({ daysUntilDue }) => daysUntilDue >= 0 && daysUntilDue <= 7)
    .sort((a, b) => a.daysUntilDue - b.daysUntilDue)
}
