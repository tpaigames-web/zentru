import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, CheckCircle2, CreditCard, Sparkles } from 'lucide-react'
import { useCardStore } from '@/stores/useCardStore'
import { useTransactionStore } from '@/stores/useTransactionStore'
import { useCategoryStore } from '@/stores/useCategoryStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { getAllRecommendations, getCapAlerts } from '@/services/cardRecommender'
import { CategoryIcon } from '@/components/shared/CategoryIcon'
import { formatAmount } from '@/lib/currency'
import { cn } from '@/lib/utils'

export default function SmartCardPage() {
  const { t } = useTranslation()
  const { cards } = useCardStore()
  const { transactions } = useTransactionStore()
  const { getExpenseCategories } = useCategoryStore()
  const currency = useSettingsStore((s) => s.currency)

  const expenseCategories = getExpenseCategories()
  const categoryIds = expenseCategories.map((c) => c.id)
  const categoryMap = useMemo(
    () => new Map(expenseCategories.map((c) => [c.id, c])),
    [expenseCategories],
  )

  const recommendations = useMemo(
    () => getAllRecommendations(cards, transactions, categoryIds),
    [cards, transactions, categoryIds],
  )

  const capAlerts = useMemo(
    () => getCapAlerts(cards, transactions),
    [cards, transactions],
  )

  // Sign-up bonus progress
  const cardsWithBonus = cards.filter((c) => c.signUpBonus && !c.signUpBonus.isCompleted)

  // Points expiring soon (within 30 days)
  const expiringPoints = cards.filter((c) => {
    if (!c.pointsConfig?.expiryDate) return false
    const daysLeft = Math.ceil((c.pointsConfig.expiryDate - Date.now()) / (1000 * 60 * 60 * 24))
    return daysLeft > 0 && daysLeft <= 30
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Sparkles className="h-6 w-6 text-primary" />
        <h2 className="text-xl md:text-2xl font-bold">{t('nav.smartCard')}</h2>
      </div>

      {/* Cap Alerts */}
      {capAlerts.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-destructive flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" /> Cap Alerts
          </h3>
          {capAlerts.map((alert, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3">
              <div>
                <p className="text-sm font-medium">{alert.card.name}</p>
                <p className="text-xs text-muted-foreground">{alert.rule} cashback</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-destructive">
                  {formatAmount(alert.used, currency)} / {formatAmount(alert.cap, currency)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {alert.used >= alert.cap ? 'Cap reached!' : 'Almost reached'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sign-up Bonus Progress */}
      {cardsWithBonus.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <CreditCard className="h-4 w-4" /> Sign-up Bonus Progress
          </h3>
          {cardsWithBonus.map((card) => {
            const bonus = card.signUpBonus!
            const pct = bonus.targetAmount > 0 ? (bonus.currentProgress / bonus.targetAmount) * 100 : 0
            const daysLeft = bonus.deadline
              ? Math.max(0, Math.ceil((bonus.deadline - Date.now()) / (1000 * 60 * 60 * 24)))
              : null

            return (
              <div key={card.id} className="rounded-xl border bg-card p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold">{card.name}</p>
                  {daysLeft !== null && (
                    <span className={cn('text-xs font-medium', daysLeft <= 7 ? 'text-destructive' : 'text-muted-foreground')}>
                      {daysLeft}d left
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mb-2">{bonus.description} → {bonus.rewardDescription}</p>
                <div className="flex items-end justify-between mb-1">
                  <span className="text-sm font-bold">{formatAmount(bonus.currentProgress, currency)}</span>
                  <span className="text-xs text-muted-foreground">/ {formatAmount(bonus.targetAmount, currency)}</span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div
                    className={cn('h-full rounded-full', pct >= 100 ? 'bg-success' : 'bg-primary')}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Points Expiring */}
      {expiringPoints.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-warning flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" /> Points Expiring Soon
          </h3>
          {expiringPoints.map((card) => {
            const pts = card.pointsConfig!
            const daysLeft = Math.ceil((pts.expiryDate! - Date.now()) / (1000 * 60 * 60 * 24))
            return (
              <div key={card.id} className="flex items-center justify-between rounded-lg border border-warning/20 bg-warning/5 px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{card.name}</p>
                  <p className="text-xs text-muted-foreground">{pts.pointsName}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{pts.currentBalance.toLocaleString()} pts</p>
                  <p className="text-xs text-warning">{daysLeft} days left</p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Smart Recommendations by Category */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Best Card per Category</h3>
        {recommendations.length === 0 ? (
          <div className="rounded-xl border bg-card py-12 text-center shadow-sm">
            <p className="text-sm text-muted-foreground">
              Add cashback rules to your cards to get recommendations.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {recommendations.map(({ categoryId, bestCard, recommendations: recs }) => {
              const cat = categoryMap.get(categoryId)
              if (!cat) return null

              return (
                <div key={categoryId} className="rounded-xl border bg-card p-3 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                      style={{ backgroundColor: cat.color + '20' }}
                    >
                      <CategoryIcon name={cat.icon} className="h-5 w-5" style={{ color: cat.color }} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{cat.nameKey ? t(cat.nameKey) : cat.name}</p>
                      {bestCard ? (
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                          <span className="text-xs text-success font-medium">
                            {bestCard.cardName} ({bestCard.rate}%)
                          </span>
                          {bestCard.remainingCap !== null && (
                            <span className="text-xs text-muted-foreground">
                              · {formatAmount(bestCard.remainingCap, currency)} left
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-destructive">All cards capped</span>
                      )}
                    </div>

                    {/* Other cards */}
                    {recs.length > 1 && (
                      <div className="flex -space-x-1">
                        {recs.slice(0, 3).map((r) => (
                          <div
                            key={r.cardId}
                            className={cn(
                              'h-6 w-6 rounded-full border-2 border-card',
                              r.isCapReached && 'opacity-40',
                            )}
                            style={{ backgroundColor: r.cardColor }}
                            title={`${r.cardName} (${r.rate}%)${r.isCapReached ? ' - Capped' : ''}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <p className="text-[10px] text-muted-foreground/60 text-center px-4">{t('transactions.cashbackDisclaimer')}</p>
    </div>
  )
}
