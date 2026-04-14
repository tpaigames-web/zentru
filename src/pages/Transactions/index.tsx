import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Receipt, Trash2, Search, CheckSquare, X } from 'lucide-react'
import { useNavigate } from 'react-router'
import { useTransactionStore } from '@/stores/useTransactionStore'
import { useCategoryStore } from '@/stores/useCategoryStore'
import { useCardStore } from '@/stores/useCardStore'
import { useAccountStore } from '@/stores/useAccountStore'
import { CategoryIcon } from '@/components/shared/CategoryIcon'
import { formatAmount } from '@/lib/currency'
import { formatDate } from '@/lib/date'
import { cn } from '@/lib/utils'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { EditTransaction } from './EditTransaction'
import type { Transaction } from '@/models/transaction'

export default function TransactionsPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { transactions, deleteTransaction, updateTransaction } = useTransactionStore()
  const { categories } = useCategoryStore()
  const { cards } = useCardStore()
  const { accounts } = useAccountStore()

  const [filterType, setFilterType] = useState<string>('all')
  const [filterCardId, setFilterCardId] = useState<string>('')
  const [filterCategoryId] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showConfirmDelete, setShowConfirmDelete] = useState<string | null>(null)
  const [editingTx, setEditingTx] = useState<Transaction | null>(null)
  const [bulkMode, setBulkMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showBulkCategoryPicker, setShowBulkCategoryPicker] = useState(false)

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
  )

  const cardMap = useMemo(
    () => new Map(cards.map((c) => [c.id, c])),
    [cards],
  )
  const accountMap = useMemo(
    () => new Map(accounts.map((a) => [a.id, a])),
    [accounts],
  )

  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      if (filterType !== 'all' && tx.type !== filterType) return false
      if (filterCardId && tx.cardId !== filterCardId) return false
      if (filterCategoryId && tx.categoryId !== filterCategoryId) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const cat = categoryMap.get(tx.categoryId)
        const catName = cat?.nameKey ? cat.nameKey : cat?.name || ''
        const matchMerchant = tx.merchant?.toLowerCase().includes(q)
        const matchNotes = tx.notes?.toLowerCase().includes(q)
        const matchCategory = catName.toLowerCase().includes(q)
        const matchAmount = tx.amount.toFixed(2).includes(q)
        if (!matchMerchant && !matchNotes && !matchCategory && !matchAmount) return false
      }
      return true
    })
  }, [transactions, filterType, filterCardId, filterCategoryId, searchQuery, categoryMap])

  // Group transactions by date
  const grouped = useMemo(() => {
    const groups: Record<string, typeof filtered> = {}
    for (const tx of filtered) {
      const key = formatDate(tx.date, 'yyyy-MM-dd', i18n.language)
      if (!groups[key]) groups[key] = []
      groups[key].push(tx)
    }
    return Object.entries(groups)
  }, [filtered, i18n.language])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl md:text-2xl font-bold">{t('transactions.title')}</h2>
        <div className="flex gap-2">
          <button
            onClick={() => { setBulkMode(!bulkMode); setSelectedIds(new Set()) }}
            className={cn('flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors', bulkMode ? 'bg-primary text-primary-foreground' : 'hover:bg-accent')}
          >
            <CheckSquare className="h-3.5 w-3.5" />
            Bulk Edit
          </button>
          {!bulkMode && (
            <button
              onClick={() => navigate('/transactions/new')}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
            >
              <Plus className="h-3.5 w-3.5" />
              {t('transactions.addTransaction')}
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('common.search') + '...'}
          className="w-full rounded-lg border bg-background pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {['all', 'expense', 'income', 'transfer'].map((ft) => (
          <button
            key={ft}
            onClick={() => setFilterType(ft)}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium transition-colors',
              filterType === ft
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-accent',
            )}
          >
            {ft === 'all' ? t('common.all') : t(`transactions.${ft}`)}
          </button>
        ))}

        {cards.length > 0 && (
          <select
            value={filterCardId}
            onChange={(e) => setFilterCardId(e.target.value)}
            className="rounded-full border bg-background px-3 py-1 text-xs"
          >
            <option value="">{t('transactions.card')}: {t('common.all')}</option>
            {cards.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Transaction list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border bg-card py-16 shadow-sm">
          <Receipt className="mb-4 h-12 w-12 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">{t('transactions.noTransactions')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map(([dateKey, txs]) => (
            <div key={dateKey}>
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                {formatDate(txs[0].date, 'PPP', i18n.language)}
              </p>
              <div className="rounded-xl border bg-card shadow-sm divide-y">
                {txs.map((tx) => {
                  const cat = categoryMap.get(tx.categoryId)
                  const card = tx.cardId ? cardMap.get(tx.cardId) : null
                  const account = tx.accountId ? accountMap.get(tx.accountId) : null
                  const paymentName = card?.name || account?.name
                  return (
                    <div key={tx.id} className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-accent/30 transition-colors" onClick={() => {
                      if (bulkMode) {
                        setSelectedIds(prev => {
                          const next = new Set(prev)
                          if (next.has(tx.id)) next.delete(tx.id)
                          else next.add(tx.id)
                          return next
                        })
                      } else {
                        setEditingTx(tx)
                      }
                    }}>
                      {bulkMode && (
                        <div className={cn(
                          'flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors',
                          selectedIds.has(tx.id) ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/40'
                        )}>
                          {selectedIds.has(tx.id) && <CheckSquare className="h-3.5 w-3.5" />}
                        </div>
                      )}
                      {cat && (
                        <div
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                          style={{ backgroundColor: cat.color + '20' }}
                        >
                          <CategoryIcon name={cat.icon} className="h-5 w-5" style={{ color: cat.color }} />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {cat ? (cat.nameKey ? t(cat.nameKey) : cat.name) : t('common.noData')}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {[tx.merchant, paymentName].filter(Boolean).join(' · ') || tx.notes || ''}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={cn(
                          'text-sm font-semibold whitespace-nowrap',
                          tx.type === 'income' ? 'text-success' : 'text-foreground',
                      )}>
                        {tx.type === 'income' ? '+' : '-'}{formatAmount(tx.amount, tx.currency)}
                      </span>
                      {tx.cashbackAmount ? (
                        <p className="text-xs text-success">+{formatAmount(tx.cashbackAmount, tx.currency)} cb</p>
                      ) : null}
                      </div>
                      {!bulkMode && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setShowConfirmDelete(tx.id) }}
                          className="shrink-0 rounded-full p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {showConfirmDelete && (
        <ConfirmDialog
          title={t('common.delete')}
          message={t('transactions.confirmDelete')}
          onConfirm={() => { deleteTransaction(showConfirmDelete); setShowConfirmDelete(null) }}
          onCancel={() => setShowConfirmDelete(null)}
        />
      )}

      {editingTx && (
        <EditTransaction
          transaction={editingTx}
          onClose={() => setEditingTx(null)}
        />
      )}

      {/* Bulk Edit Bottom Toolbar */}
      {bulkMode && (
        <div className="fixed bottom-16 md:bottom-0 left-0 right-0 z-[60] border-t bg-card px-4 py-3 shadow-lg">
          <div className="mx-auto flex max-w-lg items-center justify-between">
            <span className="text-sm font-medium">{selectedIds.size} selected</span>
            <div className="flex gap-2">
              <button
                onClick={() => { setBulkMode(false); setSelectedIds(new Set()) }}
                className="rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-accent"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={() => {
                  if (selectedIds.size === 0) return
                  setShowBulkCategoryPicker(true)
                }}
                disabled={selectedIds.size === 0}
                className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50"
              >
                {t('transactions.category')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Category Picker */}
      {showBulkCategoryPicker && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50" onClick={() => setShowBulkCategoryPicker(false)}>
          <div className="w-full max-w-lg rounded-t-2xl bg-card p-4 pb-8 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">{t('transactions.category')}</h3>
              <button onClick={() => setShowBulkCategoryPicker(false)} className="rounded-full p-1 hover:bg-accent">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2 max-h-[50vh] overflow-y-auto">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={async () => {
                    for (const id of selectedIds) {
                      await updateTransaction(id, { categoryId: cat.id })
                    }
                    setShowBulkCategoryPicker(false)
                    setBulkMode(false)
                    setSelectedIds(new Set())
                  }}
                  className="flex flex-col items-center gap-1 rounded-xl p-2 hover:bg-accent transition-colors"
                >
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-full"
                    style={{ backgroundColor: cat.color + '20' }}
                  >
                    <CategoryIcon name={cat.icon} className="h-5 w-5" style={{ color: cat.color }} />
                  </div>
                  <span className="text-[10px] text-center leading-tight line-clamp-2">
                    {cat.nameKey ? t(cat.nameKey) : cat.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
