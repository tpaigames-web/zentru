import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  PieChart, Pie, Cell, BarChart, Bar,
  YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { useTransactionStore } from '@/stores/useTransactionStore'
import { useCardStore } from '@/stores/useCardStore'
import { useCategoryStore } from '@/stores/useCategoryStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { getCategoryTotals, getMerchantTotals } from '@/services/analytics'
import { getCardCashbackRanking, getCategoryCashbackBreakdown } from '@/services/cashback'
import { formatAmount } from '@/lib/currency'
import { CategoryIcon } from '@/components/shared/CategoryIcon'
import { DateRangePicker, getQuickRange, type DateRange } from '@/components/shared/DateRangePicker'
import { cn } from '@/lib/utils'
import { EXPENSE_COLOR, INCOME_COLOR } from '@/styles/chartTheme'
import { getTaxSummary, getTotalTaxRelief } from '@/services/taxDeduction'

type ReportTab = 'overview' | 'expenses' | 'income' | 'cashback' | 'investment' | 'merchant' | 'tax'

export default function AnalyticsPage() {
  const { t } = useTranslation()
  const { transactions } = useTransactionStore()
  const { cards } = useCardStore()
  const { categories } = useCategoryStore()
  const currency = useSettingsStore((s) => s.currency)

  const [activeTab, setActiveTab] = useState<ReportTab>('overview')
  const [dateRange, setDateRange] = useState<DateRange>(getQuickRange('this_month'))

  const filteredTx = useMemo(
    () => transactions.filter((tx) => tx.date >= dateRange.start && tx.date <= dateRange.end),
    [transactions, dateRange],
  )

  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])

  // Computed data
  const totalExpense = filteredTx.filter((tx) => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0)
  const totalIncome = filteredTx.filter((tx) => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0)
  const totalCashback = filteredTx.reduce((s, tx) => s + (tx.cashbackAmount || 0), 0)
  const netFlow = totalIncome - totalExpense
  const txCount = filteredTx.length

  const expenseByCategory = useMemo(() => getCategoryTotals(filteredTx, categories, 'expense'), [filteredTx, categories])
  const incomeByCategory = useMemo(() => getCategoryTotals(filteredTx, categories, 'income'), [filteredTx, categories])
  const merchantTotals = useMemo(() => getMerchantTotals(filteredTx, 'expense'), [filteredTx])
  const cardCashback = useMemo(() => getCardCashbackRanking(filteredTx, cards), [filteredTx, cards])
  const categoryCashback = useMemo(() => getCategoryCashbackBreakdown(filteredTx, categories), [filteredTx, categories])

  const tabs: { key: ReportTab; labelKey: string }[] = [
    { key: 'overview', labelKey: 'analytics.overview' },
    { key: 'expenses', labelKey: 'analytics.expenses' },
    { key: 'income', labelKey: 'analytics.income' },
    { key: 'cashback', labelKey: 'analytics.cashbackTab' },
    { key: 'investment', labelKey: 'analytics.investment' },
    { key: 'merchant', labelKey: 'analytics.byMerchant' },
    { key: 'tax', labelKey: 'analytics.tax' },
  ]

  const tooltipStyle = {
    backgroundColor: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '8px',
    fontSize: '12px',
  }

  const renderCategoryList = (data: ReturnType<typeof getCategoryTotals>, total: number) => (
    <div className="space-y-2 mt-4">
      {data.slice(0, 10).map((item) => (
        <div key={item.categoryId} className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: item.color + '20' }}>
            <CategoryIcon name={item.icon} className="h-4 w-4" style={{ color: item.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium truncate">{item.nameKey ? t(item.nameKey) : item.name}</span>
              <span className="text-sm font-semibold">{formatAmount(item.total, currency)}</span>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <div className="h-1.5 flex-1 rounded-full bg-muted">
                <div className="h-full rounded-full" style={{ width: `${item.percentage}%`, backgroundColor: item.color }} />
              </div>
              <span className="text-xs text-muted-foreground w-10 text-right">{item.percentage.toFixed(0)}%</span>
            </div>
          </div>
        </div>
      ))}
      {total > 0 && (
        <div className="flex items-center justify-between border-t pt-2">
          <span className="text-sm text-muted-foreground">{t('common.all')}</span>
          <span className="text-base font-bold">{formatAmount(total, currency)}</span>
        </div>
      )}
    </div>
  )

  const renderPieChart = (data: ReturnType<typeof getCategoryTotals>) => (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="total" strokeWidth={2} stroke="hsl(var(--card))">
            {data.map((entry) => <Cell key={entry.categoryId} fill={entry.color} />)}
          </Pie>
          <Tooltip formatter={(value) => formatAmount(Number(value), currency)} contentStyle={tooltipStyle} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )

  const noData = <p className="py-12 text-center text-sm text-muted-foreground">{t('common.noData')}</p>

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xl md:text-2xl font-bold shrink-0">{t('analytics.title')}</h2>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      {/* Tabs - scrollable */}
      <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1 no-scrollbar">
        {tabs.map(({ key, labelKey }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={cn(
              'shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
              activeTab === key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent',
            )}
          >
            {t(labelKey)}
          </button>
        ))}
      </div>

      {/* === Overview === */}
      {activeTab === 'overview' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border bg-card p-3 shadow-sm">
              <p className="text-[11px] text-muted-foreground">{t('transactions.expense')}</p>
              <p className="mt-0.5 text-base font-bold text-destructive">{formatAmount(totalExpense, currency)}</p>
            </div>
            <div className="rounded-xl border bg-card p-3 shadow-sm">
              <p className="text-[11px] text-muted-foreground">{t('transactions.income')}</p>
              <p className="mt-0.5 text-base font-bold text-success">{formatAmount(totalIncome, currency)}</p>
            </div>
            <div className="rounded-xl border bg-card p-3 shadow-sm">
              <p className="text-[11px] text-muted-foreground">{t('analytics.net')}</p>
              <p className={cn('mt-0.5 text-base font-bold', netFlow >= 0 ? 'text-success' : 'text-destructive')}>
                {netFlow >= 0 ? '+' : ''}{formatAmount(netFlow, currency)}
              </p>
            </div>
            <div className="rounded-xl border bg-card p-3 shadow-sm">
              <p className="text-[11px] text-muted-foreground">Cashback</p>
              <p className="mt-0.5 text-base font-bold text-primary">{formatAmount(totalCashback, currency)}</p>
            </div>
          </div>

          {/* Income vs Expense bar - only show if there's data */}
          {(totalIncome > 0 || totalExpense > 0) && (
            <div className="rounded-xl border bg-card p-3 shadow-sm">
              <h3 className="mb-2 text-xs font-semibold">{t('analytics.incomeVsExpense')}</h3>
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[{ income: totalIncome, expense: totalExpense }]} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(value) => formatAmount(Number(value), currency)} contentStyle={tooltipStyle} />
                    <Bar dataKey="income" fill={INCOME_COLOR} radius={[4, 4, 0, 0]} barSize={32} name={t('transactions.income')} />
                    <Bar dataKey="expense" fill={EXPENSE_COLOR} radius={[4, 4, 0, 0]} barSize={32} name={t('transactions.expense')} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <p className="text-[11px] text-muted-foreground text-center">{txCount} {t('analytics.txInPeriod')}</p>
        </div>
      )}

      {/* === Expenses === */}
      {activeTab === 'expenses' && (
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <h3 className="mb-2 text-sm font-semibold">{t('analytics.expenseByCategory')}</h3>
          {expenseByCategory.length === 0 ? noData : (
            <>
              {renderPieChart(expenseByCategory)}
              {renderCategoryList(expenseByCategory, totalExpense)}
            </>
          )}
        </div>
      )}

      {/* === Income === */}
      {activeTab === 'income' && (
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <h3 className="mb-2 text-sm font-semibold">{t('analytics.incomeByCategory')}</h3>
          {incomeByCategory.length === 0 ? noData : (
            <>
              {renderPieChart(incomeByCategory)}
              {renderCategoryList(incomeByCategory, totalIncome)}
            </>
          )}
        </div>
      )}

      {/* === Cashback === */}
      {activeTab === 'cashback' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border bg-card p-4 shadow-sm">
              <p className="text-xs text-muted-foreground">Total Cashback</p>
              <p className="mt-1 text-xl font-bold text-success">{formatAmount(totalCashback, currency)}</p>
            </div>
            <div className="rounded-xl border bg-card p-4 shadow-sm">
              <p className="text-xs text-muted-foreground">Effective Rate</p>
              <p className="mt-1 text-xl font-bold text-primary">
                {totalExpense > 0 ? ((totalCashback / totalExpense) * 100).toFixed(2) : '0.00'}%
              </p>
            </div>
          </div>

          {/* Card ranking */}
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold">Card Ranking</h3>
            {cardCashback.length === 0 ? noData : (
              <div className="space-y-3">
                {cardCashback.map((card, i) => (
                  <div key={card.cardId} className="flex items-center gap-3">
                    <span className={cn('flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white',
                      i === 0 ? 'bg-yellow-500' : i === 1 ? 'bg-gray-400' : 'bg-muted-foreground'
                    )}>{i + 1}</span>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">{card.cardName}</span>
                        <span className="text-sm font-bold text-success">{formatAmount(card.totalCashback, currency)}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">Rate: {card.effectiveRate.toFixed(2)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Category cashback */}
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold">By Category</h3>
            {categoryCashback.filter((c) => c.totalCashback > 0).length === 0 ? noData : (
              <div className="space-y-2">
                {categoryCashback.filter((c) => c.totalCashback > 0).map((item) => (
                  <div key={item.categoryId} className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: item.color + '20' }}>
                      <CategoryIcon name={item.icon} className="h-4 w-4" style={{ color: item.color }} />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <span className="text-sm">{item.nameKey ? t(item.nameKey) : item.name}</span>
                        <span className="text-sm font-semibold text-success">{formatAmount(item.totalCashback, currency)}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{item.effectiveRate.toFixed(2)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* === Investment === */}
      {activeTab === 'investment' && (
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <h3 className="mb-2 text-sm font-semibold">{t('analytics.investmentSummary')}</h3>
          {(() => {
            const investmentIncome = filteredTx.filter((tx) => {
              const cat = categoryMap.get(tx.categoryId)
              return tx.type === 'income' && cat?.nameKey === 'category.investment_income'
            })
            const total = investmentIncome.reduce((s, tx) => s + tx.amount, 0)
            return total === 0 ? noData : (
              <div className="space-y-3">
                <div className="text-center py-4">
                  <p className="text-3xl font-bold text-success">{formatAmount(total, currency)}</p>
                  <p className="text-xs text-muted-foreground mt-1">{investmentIncome.length} transactions</p>
                </div>
                <div className="divide-y">
                  {investmentIncome.slice(0, 10).map((tx) => (
                    <div key={tx.id} className="flex justify-between py-2">
                      <div>
                        <p className="text-sm">{tx.merchant || tx.notes || 'Investment'}</p>
                        <p className="text-xs text-muted-foreground">{new Date(tx.date).toLocaleDateString()}</p>
                      </div>
                      <span className="text-sm font-semibold text-success">+{formatAmount(tx.amount, currency)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}
        </div>
      )}

      {/* === By Merchant === */}
      {activeTab === 'merchant' && (
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold">{t('analytics.topMerchants')}</h3>
          {merchantTotals.length === 0 ? noData : (
            <div className="space-y-2">
              {merchantTotals.slice(0, 15).map((item, i) => (
                <div key={item.merchant} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate">{item.merchant}</span>
                      <span className="text-sm font-semibold">{formatAmount(item.total, currency)}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="h-1.5 flex-1 rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${item.percentage}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground w-16 text-right">
                        {item.count}x · avg {formatAmount(item.avgAmount, currency)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between border-t pt-2">
                <span className="text-sm text-muted-foreground">{merchantTotals.length} merchants</span>
                <span className="text-base font-bold">{formatAmount(totalExpense, currency)}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* === Tax Deductions === */}
      {activeTab === 'tax' && (() => {
        const year = new Date(dateRange.start).getFullYear()
        const taxSummaries = getTaxSummary(transactions, year)
        const totalRelief = getTotalTaxRelief(taxSummaries)

        return (
          <div className="space-y-4">
            <div className="rounded-xl border bg-card p-4 shadow-sm text-center">
              <p className="text-xs text-muted-foreground">{t('analytics.totalTaxRelief')} ({year})</p>
              <p className="mt-1 text-3xl font-bold text-primary">{formatAmount(totalRelief, currency)}</p>
              <p className="mt-1 text-xs text-muted-foreground">{taxSummaries.length} {t('analytics.taxCategories')}</p>
            </div>

            {taxSummaries.length === 0 ? (
              <div className="rounded-xl border bg-card p-4 shadow-sm">
                {noData}
                <p className="text-xs text-muted-foreground text-center mt-2">{t('analytics.taxHint')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {taxSummaries.map((summary) => (
                  <div key={summary.taxCategory} className="rounded-xl border bg-card p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-semibold">{summary.label}</p>
                        <p className="text-xs text-muted-foreground">{summary.labelZh}</p>
                      </div>
                      <span className="text-sm font-bold text-primary">{formatAmount(summary.totalClaimed, currency)}</span>
                    </div>
                    {summary.maxRelief > 0 && (
                      <>
                        <div className="h-2 rounded-full bg-muted">
                          <div
                            className={cn('h-full rounded-full', summary.remaining <= 0 ? 'bg-success' : 'bg-primary')}
                            style={{ width: `${Math.min((summary.totalClaimed / summary.maxRelief) * 100, 100)}%` }}
                          />
                        </div>
                        <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                          <span>Max: {formatAmount(summary.maxRelief, currency)}</span>
                          <span>{summary.remaining > 0 ? `${formatAmount(summary.remaining, currency)} left` : 'Maxed!'}</span>
                        </div>
                      </>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">{summary.transactions.length} transactions</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })()}
    </div>
  )
}
