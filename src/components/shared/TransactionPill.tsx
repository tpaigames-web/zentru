import type { Transaction } from '@/models/transaction'
import type { Category } from '@/models/category'
import { CategoryIcon } from './CategoryIcon'
import { cn } from '@/lib/utils'

interface TransactionPillProps {
  transaction: Transaction
  category?: Category
  formatAmount: (amount: number) => string
  onClick?: () => void
  showTime?: boolean
}

/**
 * Cute capsule-style transaction row.
 * Colored pastel background based on category, icon on left, merchant/time middle, amount on right.
 */
export function TransactionPill({
  transaction: tx,
  category,
  formatAmount,
  onClick,
  showTime = true,
}: TransactionPillProps) {
  const color = category?.color || '#94a3b8'
  const icon = category?.icon || 'MoreHorizontal'
  const isIncome = tx.type === 'income'

  const bgColor = color + '18'
  const iconBgColor = color + '30'

  const date = new Date(tx.date)
  const timeStr = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 transition-all',
        onClick ? 'hover:scale-[1.01] active:scale-[0.99] cursor-pointer' : 'cursor-default'
      )}
      style={{ backgroundColor: bgColor }}
    >
      {/* Icon */}
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: iconBgColor }}
      >
        <CategoryIcon
          name={icon}
          className="h-5 w-5"
          style={{ color }}
        />
      </div>

      {/* Description + time */}
      <div className="flex-1 min-w-0 text-left">
        <p className="text-sm font-medium truncate" style={{ color: 'hsl(var(--foreground))' }}>
          {tx.merchant || category?.name || '—'}
        </p>
        {showTime && (
          <p className="text-xs" style={{ color: color, opacity: 0.7 }}>
            {timeStr}
          </p>
        )}
      </div>

      {/* Amount */}
      <span
        className="shrink-0 text-base font-bold tabular-nums"
        style={{ color: isIncome ? 'hsl(142 70% 40%)' : color }}
      >
        {isIncome ? '+' : '-'}{formatAmount(tx.amount)}
      </span>
    </button>
  )
}
