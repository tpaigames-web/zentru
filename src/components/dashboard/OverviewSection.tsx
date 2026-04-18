import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TrendingUp, TrendingDown, Wallet, Calendar, ChevronDown } from 'lucide-react'
import { formatAmount } from '@/lib/currency'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useTransactionStore } from '@/stores/useTransactionStore'
import { useCategoryStore } from '@/stores/useCategoryStore'
import { CategoryIcon } from '@/components/shared/CategoryIcon'
import { cn } from '@/lib/utils'

type DateRange = 'this_month' | 'last_month' | 'last_3_months' | 'last_6_months'

function getRange(key: DateRange): { start: number; end: number; label: string; labelZh: string } {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()

  switch (key) {
    case 'this_month': {
      const start = new Date(year, month, 1).getTime()
      const end = new Date(year, month + 1, 0, 23, 59, 59, 999).getTime()
      return { start, end, label: 'This month', labelZh: '本月' }
    }
    case 'last_month': {
      const start = new Date(year, month - 1, 1).getTime()
      const end = new Date(year, month, 0, 23, 59, 59, 999).getTime()
      return { start, end, label: 'Last month', labelZh: '上月' }
    }
    case 'last_3_months': {
      const start = new Date(year, month - 2, 1).getTime()
      const end = new Date(year, month + 1, 0, 23, 59, 59, 999).getTime()
      return { start, end, label: 'Last 3 months', labelZh: '最近 3 个月' }
    }
    case 'last_6_months': {
      const start = new Date(year, month - 5, 1).getTime()
      const end = new Date(year, month + 1, 0, 23, 59, 59, 999).getTime()
      return { start, end, label: 'Last 6 months', labelZh: '最近 6 个月' }
    }
  }
}

export function OverviewSection() {
  const { i18n } = useTranslation()
  const isZh = i18n.language.startsWith('zh')
  const currency = useSettingsStore((s) => s.currency)
  const { transactions } = useTransactionStore()
  const { categories } = useCategoryStore()

  const [range, setRange] = useState<DateRange>('this_month')
  const [showPicker, setShowPicker] = useState(false)

  const { start, end, label, labelZh } = getRange(range)
  const rangeLabel = isZh ? labelZh : label

  // Filter transactions
  const filteredTx = useMemo(
    () => transactions.filter((tx) => tx.date >= start && tx.date <= end),
    [transactions, start, end]
  )

  const income = filteredTx.filter((tx) => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0)
  const expense = filteredTx.filter((tx) => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0)
  const net = income - expense

  // Days in range for daily average
  const days = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)))
  const dailyAvg = expense / days

  // 6-month trend (always shows 6 months regardless of range)
  const trend = useMemo(() => {
    const now = new Date()
    const months: { label: string; income: number; expense: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const mStart = d.getTime()
      const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999).getTime()
      const txs = transactions.filter((tx) => tx.date >= mStart && tx.date <= mEnd)
      months.push({
        label: `${d.getMonth() + 1}${isZh ? '月' : ''}`,
        income: txs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
        expense: txs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
      })
    }
    return months
  }, [transactions, isZh])

  const maxTrend = Math.max(...trend.map((m) => Math.max(m.income, m.expense)), 1)

  // Top 3 expense categories
  const topCategories = useMemo(() => {
    const map = new Map<string, number>()
    filteredTx.filter((tx) => tx.type === 'expense').forEach((tx) => {
      map.set(tx.categoryId, (map.get(tx.categoryId) || 0) + tx.amount)
    })
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([catId, amount]) => ({
        category: categories.find((c) => c.id === catId),
        amount,
        percent: expense > 0 ? (amount / expense) * 100 : 0,
      }))
  }, [filteredTx, categories, expense])

  // Top 3 merchants
  const topMerchants = useMemo(() => {
    const map = new Map<string, { count: number; total: number }>()
    filteredTx.filter((tx) => tx.type === 'expense' && tx.merchant).forEach((tx) => {
      const key = tx.merchant!.trim()
      const existing = map.get(key) || { count: 0, total: 0 }
      map.set(key, { count: existing.count + 1, total: existing.total + tx.amount })
    })
    return Array.from(map.entries())
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 3)
      .map(([merchant, { count, total }]) => ({ merchant, count, total }))
  }, [filteredTx])

  const rangeOptions: { key: DateRange; zh: string; en: string }[] = [
    { key: 'this_month',    zh: '本月',           en: 'This month' },
    { key: 'last_month',    zh: '上月',           en: 'Last month' },
    { key: 'last_3_months', zh: '最近 3 个月',    en: 'Last 3 months' },
    { key: 'last_6_months', zh: '最近 6 个月',    en: 'Last 6 months' },
  ]

  return (
    <div className="space-y-4">
      {/* Date range picker */}
      <div className="relative">
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="flex items-center gap-2 rounded-lg border bg-card px-3 py-1.5 text-sm hover:bg-accent transition-colors"
        >
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{rangeLabel}</span>
          <ChevronDown className={cn('h-3.5 w-3.5 text-muted-foreground transition-transform', showPicker && 'rotate-180')} />
        </button>
        {showPicker && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowPicker(false)} />
            <div className="absolute left-0 top-full z-50 mt-1 min-w-[140px] rounded-lg border bg-card shadow-lg">
              {rangeOptions.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => { setRange(opt.key); setShowPicker(false) }}
                  className={cn(
                    'flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-accent text-left first:rounded-t-lg last:rounded-b-lg',
                    range === opt.key && 'bg-primary/10 text-primary font-medium'
                  )}
                >
                  {isZh ? opt.zh : opt.en}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Hero: Big expense + income like MeowoZhangZhang */}
      <div className="rounded-3xl bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/40 dark:to-amber-900/30 p-6 border border-orange-100 dark:border-orange-900/40">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingDown className="h-3.5 w-3.5 text-red-500" />
              <p className="text-xs text-muted-foreground font-medium">{rangeLabel} · {isZh ? '支出' : 'Expense'}</p>
            </div>
            <p className="text-3xl font-bold text-red-500 tabular-nums">{formatAmount(expense, currency)}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {isZh ? '日均' : 'Daily'} {formatAmount(dailyAvg, currency)}
            </p>
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingUp className="h-3.5 w-3.5 text-green-500" />
              <p className="text-xs text-muted-foreground font-medium">{rangeLabel} · {isZh ? '收入' : 'Income'}</p>
            </div>
            <p className="text-3xl font-bold text-green-500 tabular-nums">{formatAmount(income, currency)}</p>
            <p className={cn('mt-1 text-[11px]', net >= 0 ? 'text-green-600' : 'text-red-500')}>
              {net >= 0 ? '+' : ''}{formatAmount(net, currency)} {isZh ? '净余' : 'net'}
            </p>
          </div>
        </div>
      </div>

      {/* Secondary stats (smaller) */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 p-4 border border-primary/20">
          <div className="flex items-center gap-2 mb-1.5">
            <Wallet className="h-4 w-4 text-primary" />
            <span className="text-xs text-muted-foreground">{isZh ? '净余额' : 'Net Balance'}</span>
          </div>
          <p className={cn('text-xl font-bold tabular-nums', net >= 0 ? 'text-primary' : 'text-red-500')}>
            {net >= 0 ? '+' : ''}{formatAmount(net, currency)}
          </p>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-amber-100/50 to-amber-50/50 dark:from-amber-950/20 dark:to-amber-900/20 p-4 border border-amber-200/50 dark:border-amber-900/30">
          <div className="flex items-center gap-2 mb-1.5">
            <Calendar className="h-4 w-4 text-amber-600" />
            <span className="text-xs text-muted-foreground">{isZh ? '日均支出' : 'Daily Avg'}</span>
          </div>
          <p className="text-xl font-bold text-amber-600 tabular-nums">{formatAmount(dailyAvg, currency)}</p>
        </div>
      </div>

      {/* 6-month trend chart (simple bar chart) */}
      <div className="rounded-xl border bg-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">{isZh ? '6 个月趋势' : '6-Month Trend'}</h3>
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              {isZh ? '支出' : 'Expense'}
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              {isZh ? '收入' : 'Income'}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-6 gap-2">
          {trend.map((m, i) => (
            <div key={i} className="flex flex-col items-center">
              <div className="flex items-end justify-center gap-0.5 h-20 w-full">
                <div
                  className="w-1/2 rounded-t bg-red-500/70 transition-all"
                  style={{ height: `${(m.expense / maxTrend) * 100}%`, minHeight: m.expense > 0 ? '2px' : '0' }}
                  title={formatAmount(m.expense, currency)}
                />
                <div
                  className="w-1/2 rounded-t bg-green-500/70 transition-all"
                  style={{ height: `${(m.income / maxTrend) * 100}%`, minHeight: m.income > 0 ? '2px' : '0' }}
                  title={formatAmount(m.income, currency)}
                />
              </div>
              <span className="mt-1.5 text-[10px] text-muted-foreground">{m.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top categories + merchants */}
      {expense > 0 && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {/* Top 3 categories */}
          <div className="rounded-xl border bg-card p-4">
            <h3 className="text-sm font-semibold mb-3">{isZh ? 'Top 3 支出类别' : 'Top 3 Categories'}</h3>
            {topCategories.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">{isZh ? '暂无数据' : 'No data'}</p>
            ) : (
              <div className="space-y-3">
                {topCategories.map(({ category, amount, percent }, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                      style={{ backgroundColor: (category?.color || '#64748b') + '20' }}
                    >
                      {category ? (
                        <CategoryIcon
                          name={category.icon || 'MoreHorizontal'}
                          className="h-4 w-4"
                          style={{ color: category.color || '#64748b' }}
                        />
                      ) : (
                        <span className="h-4 w-4 rounded bg-muted" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium truncate">
                          {category
                            ? (category.nameKey && isZh
                              ? (i18n.t(category.nameKey, { defaultValue: category.name }) as string)
                              : category.name)
                            : (isZh ? '未分类' : 'Uncategorized')}
                        </span>
                        <span className="text-xs text-muted-foreground shrink-0 ml-2">
                          {formatAmount(amount, currency)}
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-[10px] text-muted-foreground w-10 text-right">
                      {percent.toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top 3 merchants */}
          <div className="rounded-xl border bg-card p-4">
            <h3 className="text-sm font-semibold mb-3">{isZh ? 'Top 3 商户' : 'Top 3 Merchants'}</h3>
            {topMerchants.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">{isZh ? '暂无数据' : 'No data'}</p>
            ) : (
              <div className="space-y-3">
                {topMerchants.map(({ merchant, count, total }, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-xs font-bold text-muted-foreground">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{merchant}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {count} {isZh ? '笔' : 'tx'}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-red-500">
                      {formatAmount(total, currency)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
