import {
  format,
  startOfMonth,
  endOfMonth,
  addMonths,
  differenceInDays,
  setDate,
  isAfter,
  isBefore,
} from 'date-fns'
import { zhCN, enUS } from 'date-fns/locale'

export function getLocale(lang: string) {
  return lang.startsWith('zh') ? zhCN : enUS
}

export function formatDate(timestamp: number, pattern: string, lang = 'zh-CN'): string {
  return format(timestamp, pattern, { locale: getLocale(lang) })
}

export function getMonthRange(date: Date = new Date()) {
  return {
    start: startOfMonth(date).getTime(),
    end: endOfMonth(date).getTime(),
  }
}

export function getNextDueDate(dueDay: number): Date {
  const now = new Date()
  let due = setDate(now, dueDay)
  if (isBefore(due, now)) {
    due = setDate(addMonths(now, 1), dueDay)
  }
  return due
}

export function getDaysUntilDue(dueDay: number): number {
  const due = getNextDueDate(dueDay)
  return differenceInDays(due, new Date())
}

export function getBillingPeriod(billingDay: number) {
  const now = new Date()
  let start = setDate(now, billingDay)
  if (isAfter(start, now)) {
    start = setDate(addMonths(now, -1), billingDay)
  }
  const end = setDate(addMonths(start, 1), billingDay)
  return { start: start.getTime(), end: end.getTime() }
}
