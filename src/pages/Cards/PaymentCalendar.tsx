import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, ChevronLeft, ChevronRight, Calendar as CalIcon, CreditCard, FileText } from 'lucide-react'
import { useCardStore } from '@/stores/useCardStore'
import { formatAmount } from '@/lib/currency'
import { getBankColors } from '@/config/cardTypes'
import { cn } from '@/lib/utils'

interface DayEvent {
  type: 'due' | 'statement'
  cardId: string
  cardName: string
  bank: string
  last4?: string
  balance: number
  currency: string
}

/**
 * Monthly payment calendar.
 * Shows statement dates (generation) and due dates (payment) for each credit card.
 */
export default function PaymentCalendarPage() {
  const { i18n } = useTranslation()
  const navigate = useNavigate()
  const { cards } = useCardStore()
  const isZh = i18n.language.startsWith('zh')

  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth()) // 0-11
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate())

  const activeCards = useMemo(() => cards.filter((c) => c.isActive), [cards])

  // Build event map: day (1-31) → events
  const eventsByDay = useMemo(() => {
    const map = new Map<number, DayEvent[]>()
    for (const card of activeCards) {
      const addEvent = (day: number, type: 'due' | 'statement') => {
        if (!day || day < 1 || day > 31) return
        if (!map.has(day)) map.set(day, [])
        map.get(day)!.push({
          type,
          cardId: card.id,
          cardName: card.name,
          bank: card.bank,
          last4: card.lastFourDigits,
          balance: card.currentBalance,
          currency: card.currency,
        })
      }
      if (card.dueDay) addEvent(card.dueDay, 'due')
      if (card.billingDay) addEvent(card.billingDay, 'statement')
    }
    return map
  }, [activeCards])

  // Calendar grid computation
  const firstOfMonth = new Date(viewYear, viewMonth, 1)
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const startWeekday = firstOfMonth.getDay() // 0 = Sunday
  const weekdayLabels = isZh ? ['日', '一', '二', '三', '四', '五', '六'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const monthLabels = isZh
    ? ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
    : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear(viewYear - 1)
    } else {
      setViewMonth(viewMonth - 1)
    }
    setSelectedDay(null)
  }
  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear(viewYear + 1)
    } else {
      setViewMonth(viewMonth + 1)
    }
    setSelectedDay(null)
  }
  const handleToday = () => {
    const now = new Date()
    setViewYear(now.getFullYear())
    setViewMonth(now.getMonth())
    setSelectedDay(now.getDate())
  }

  const isCurrentMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth()
  const selectedEvents = selectedDay ? eventsByDay.get(selectedDay) || [] : []

  // Upcoming next 30 days summary
  const upcoming = useMemo(() => {
    const result: Array<{ date: Date; day: number; events: DayEvent[] }> = []
    const t0 = new Date()
    t0.setHours(0, 0, 0, 0)
    for (let offset = 0; offset < 30; offset++) {
      const d = new Date(t0)
      d.setDate(t0.getDate() + offset)
      const events = eventsByDay.get(d.getDate()) || []
      // Only events matching this specific month day
      if (events.length > 0) {
        result.push({ date: d, day: d.getDate(), events })
      }
    }
    return result
  }, [eventsByDay])

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="rounded-full p-1 hover:bg-accent">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h2 className="text-xl md:text-2xl font-bold flex-1">
          {isZh ? '还款日历' : 'Payment Calendar'}
        </h2>
        <button
          onClick={handleToday}
          className="rounded-lg border bg-card px-3 py-1 text-xs font-medium hover:bg-accent"
        >
          {isZh ? '今天' : 'Today'}
        </button>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-1 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-destructive" />
          {isZh ? '还款日' : 'Due'}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-primary" />
          {isZh ? '账单日' : 'Statement'}
        </span>
      </div>

      {/* Month navigator */}
      <div className="flex items-center justify-between rounded-xl border bg-card px-3 py-2.5 shadow-sm">
        <button onClick={handlePrevMonth} className="rounded-full p-1 hover:bg-accent">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2">
          <CalIcon className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">{monthLabels[viewMonth]} {viewYear}</span>
        </div>
        <button onClick={handleNextMonth} className="rounded-full p-1 hover:bg-accent">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Calendar grid */}
      <div className="rounded-xl border bg-card p-2 shadow-sm">
        {/* Weekday header */}
        <div className="grid grid-cols-7 border-b pb-1.5 mb-1.5">
          {weekdayLabels.map((w, i) => (
            <div key={i} className="text-center text-[10px] font-semibold text-muted-foreground">
              {w}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7 gap-0.5">
          {/* Empty cells before day 1 */}
          {Array.from({ length: startWeekday }, (_, i) => (
            <div key={`pad-${i}`} className="aspect-square" />
          ))}
          {/* Actual days */}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1
            const events = eventsByDay.get(day) || []
            const hasDue = events.some((e) => e.type === 'due')
            const hasStatement = events.some((e) => e.type === 'statement')
            const isToday = isCurrentMonth && day === today.getDate()
            const isSelected = day === selectedDay
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={cn(
                  'aspect-square flex flex-col items-center justify-center rounded-md text-xs font-medium transition-colors relative',
                  isSelected && 'bg-primary text-primary-foreground',
                  !isSelected && isToday && 'bg-accent ring-1 ring-primary',
                  !isSelected && !isToday && 'hover:bg-accent',
                )}
              >
                <span>{day}</span>
                {(hasDue || hasStatement) && (
                  <div className="absolute bottom-0.5 flex items-center gap-0.5">
                    {hasDue && <span className={cn('h-1 w-1 rounded-full', isSelected ? 'bg-white' : 'bg-destructive')} />}
                    {hasStatement && <span className={cn('h-1 w-1 rounded-full', isSelected ? 'bg-white' : 'bg-primary')} />}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected day details */}
      {selectedDay && (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="border-b bg-muted/30 px-3 py-2">
            <p className="text-xs font-semibold">
              {monthLabels[viewMonth]} {selectedDay}, {viewYear}
            </p>
          </div>
          {selectedEvents.length === 0 ? (
            <p className="px-3 py-6 text-center text-xs text-muted-foreground">
              {isZh ? '无还款/账单事件' : 'No events on this day'}
            </p>
          ) : (
            <div className="divide-y">
              {selectedEvents.map((ev, idx) => {
                const bankColors = getBankColors(ev.bank)
                return (
                  <button
                    key={idx}
                    onClick={() => navigate(`/cards/${ev.cardId}`)}
                    className="flex items-center gap-2.5 w-full px-3 py-2.5 text-left hover:bg-accent transition-colors"
                  >
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                      style={{ backgroundColor: bankColors.bg }}
                    >
                      {ev.type === 'due' ? (
                        <CreditCard className="h-4 w-4" style={{ color: bankColors.text }} />
                      ) : (
                        <FileText className="h-4 w-4" style={{ color: bankColors.text }} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-semibold truncate">{ev.cardName}</p>
                        {ev.last4 && (
                          <span className="font-mono text-[10px] text-muted-foreground">·{ev.last4}</span>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        {ev.type === 'due'
                          ? (isZh ? '还款日' : 'Payment Due')
                          : (isZh ? '账单生成日' : 'Statement Closing')}
                      </p>
                    </div>
                    {ev.type === 'due' && ev.balance > 0 && (
                      <span className="text-xs font-bold text-destructive whitespace-nowrap">
                        {formatAmount(ev.balance, ev.currency)}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Upcoming 30 days list */}
      {upcoming.length > 0 && (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="border-b bg-muted/30 px-3 py-2">
            <p className="text-xs font-semibold">
              {isZh ? '未来 30 天' : 'Next 30 Days'}
            </p>
          </div>
          <div className="divide-y">
            {upcoming.slice(0, 15).map((u, i) => (
              <div key={i} className="px-3 py-2">
                <p className="text-[10px] font-semibold text-muted-foreground mb-1">
                  {monthLabels[u.date.getMonth()]} {u.date.getDate()}
                </p>
                <div className="space-y-1">
                  {u.events.map((ev, j) => (
                    <button
                      key={j}
                      onClick={() => navigate(`/cards/${ev.cardId}`)}
                      className="flex items-center gap-2 w-full text-left hover:bg-accent rounded px-1 py-1 transition-colors"
                    >
                      <span
                        className={cn(
                          'h-1.5 w-1.5 rounded-full shrink-0',
                          ev.type === 'due' ? 'bg-destructive' : 'bg-primary',
                        )}
                      />
                      <span className="text-xs flex-1 truncate">{ev.cardName}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {ev.type === 'due' ? (isZh ? '还款' : 'Due') : (isZh ? '账单' : 'Stmt')}
                      </span>
                      {ev.type === 'due' && ev.balance > 0 && (
                        <span className="text-[11px] font-bold text-destructive whitespace-nowrap">
                          {formatAmount(ev.balance, ev.currency)}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeCards.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border bg-card py-12 shadow-sm">
          <CreditCard className="mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            {isZh ? '暂无信用卡' : 'No cards yet'}
          </p>
          <button
            onClick={() => navigate('/cards')}
            className="mt-3 rounded-lg bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground"
          >
            {isZh ? '去添加' : 'Add card'}
          </button>
        </div>
      )}
    </div>
  )
}
