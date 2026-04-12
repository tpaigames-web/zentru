import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Calendar } from 'lucide-react'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfYear, endOfYear, subMonths, subYears } from 'date-fns'
import { getLocale } from '@/lib/date'

export type QuickRange = 'this_week' | 'this_month' | 'this_year' | 'last_month' | 'last_3_months' | 'last_6_months' | 'last_year' | 'custom'

export interface DateRange {
  start: number
  end: number
  label: string
}

interface DateRangePickerProps {
  value: DateRange
  onChange: (range: DateRange) => void
}

const QUICK_RANGES: { key: QuickRange; labelKey: string }[] = [
  { key: 'this_week', labelKey: 'dateRange.thisWeek' },
  { key: 'this_month', labelKey: 'dateRange.thisMonth' },
  { key: 'this_year', labelKey: 'dateRange.thisYear' },
  { key: 'last_month', labelKey: 'dateRange.lastMonth' },
  { key: 'last_3_months', labelKey: 'dateRange.last3Months' },
  { key: 'last_6_months', labelKey: 'dateRange.last6Months' },
  { key: 'last_year', labelKey: 'dateRange.lastYear' },
  { key: 'custom', labelKey: 'dateRange.custom' },
]

export function getQuickRange(key: QuickRange): DateRange {
  const now = new Date()
  switch (key) {
    case 'this_week':
      return { start: startOfWeek(now, { weekStartsOn: 1 }).getTime(), end: endOfWeek(now, { weekStartsOn: 1 }).getTime(), label: 'This Week' }
    case 'this_month':
      return { start: startOfMonth(now).getTime(), end: endOfMonth(now).getTime(), label: 'This Month' }
    case 'this_year':
      return { start: startOfYear(now).getTime(), end: endOfYear(now).getTime(), label: 'This Year' }
    case 'last_month': {
      const lm = subMonths(now, 1)
      return { start: startOfMonth(lm).getTime(), end: endOfMonth(lm).getTime(), label: 'Last Month' }
    }
    case 'last_3_months':
      return { start: startOfMonth(subMonths(now, 2)).getTime(), end: endOfMonth(now).getTime(), label: 'Last 3 Months' }
    case 'last_6_months':
      return { start: startOfMonth(subMonths(now, 5)).getTime(), end: endOfMonth(now).getTime(), label: 'Last 6 Months' }
    case 'last_year': {
      const ly = subYears(now, 1)
      return { start: startOfYear(ly).getTime(), end: endOfYear(ly).getTime(), label: 'Last Year' }
    }
    default:
      return { start: startOfMonth(now).getTime(), end: endOfMonth(now).getTime(), label: 'Custom' }
  }
}

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const { t, i18n } = useTranslation()
  const [showDropdown, setShowDropdown] = useState(false)
  const [showCustom, setShowCustom] = useState(false)
  const [customStart, setCustomStart] = useState(format(value.start, 'yyyy-MM-dd'))
  const [customEnd, setCustomEnd] = useState(format(value.end, 'yyyy-MM-dd'))

  const locale = getLocale(i18n.language)
  const displayLabel = `${format(value.start, 'dd MMM', { locale })} - ${format(value.end, 'dd MMM', { locale })}`

  const handleQuickRange = (key: QuickRange) => {
    if (key === 'custom') {
      setShowCustom(true)
      setShowDropdown(false)
      return
    }
    onChange(getQuickRange(key))
    setShowDropdown(false)
  }

  const handleCustomApply = () => {
    const start = new Date(customStart)
    const end = new Date(customEnd)
    end.setHours(23, 59, 59, 999)
    onChange({ start: start.getTime(), end: end.getTime(), label: 'Custom' })
    setShowCustom(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-1.5 rounded-lg border bg-card px-2.5 py-1.5 text-xs hover:bg-accent transition-colors"
      >
        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="font-medium">{displayLabel}</span>
      </button>

      {showDropdown && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
          <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-xl border bg-card p-1 shadow-lg">
            {QUICK_RANGES.map(({ key, labelKey }) => (
              <button
                key={key}
                onClick={() => handleQuickRange(key)}
                className="flex w-full items-center rounded-lg px-3 py-2 text-sm hover:bg-accent transition-colors"
              >
                {t(labelKey)}
              </button>
            ))}
          </div>
        </>
      )}

      {showCustom && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowCustom(false)} />
          <div className="absolute right-0 top-full z-50 mt-1 w-64 rounded-xl border bg-card p-4 shadow-lg space-y-3">
            <div>
              <label className="block text-xs font-medium mb-1">{t('dateRange.from')}</label>
              <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">{t('dateRange.to')}</label>
              <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none" />
            </div>
            <button onClick={handleCustomApply}
              className="w-full rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              {t('dateRange.apply')}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
