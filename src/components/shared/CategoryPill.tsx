import type { Category } from '@/models/category'
import { CategoryIcon } from './CategoryIcon'
import { cn } from '@/lib/utils'

interface CategoryPillProps {
  category?: Category
  label?: string
  amount?: string
  selected?: boolean
  size?: 'sm' | 'md' | 'lg'
  onClick?: () => void
  showAmount?: boolean
}

/**
 * Cute capsule-style category pill, inspired by MeowoZhangZhang app.
 * Features colored background, icon on left, label, optional amount.
 */
export function CategoryPill({
  category,
  label,
  amount,
  selected,
  size = 'md',
  onClick,
  showAmount = false,
}: CategoryPillProps) {
  const color = category?.color || '#94a3b8'
  const icon = category?.icon || 'MoreHorizontal'
  const name = label || category?.name || 'Other'

  // Create pastel background from the color (light tint)
  const bgColor = color + '20' // 12.5% opacity
  const iconBgColor = color + '35' // 20% opacity

  const sizes = {
    sm: {
      container: 'px-2.5 py-1.5',
      icon: 'h-6 w-6',
      iconSize: 'h-3.5 w-3.5',
      text: 'text-xs',
    },
    md: {
      container: 'px-3 py-2',
      icon: 'h-8 w-8',
      iconSize: 'h-4 w-4',
      text: 'text-sm',
    },
    lg: {
      container: 'px-4 py-3',
      icon: 'h-10 w-10',
      iconSize: 'h-5 w-5',
      text: 'text-base',
    },
  }
  const s = sizes[size]

  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        'flex items-center gap-2 rounded-full transition-all',
        s.container,
        selected && 'ring-2 ring-offset-2 ring-offset-background',
        onClick ? 'hover:scale-105 active:scale-95 cursor-pointer' : 'cursor-default'
      )}
      style={{
        backgroundColor: bgColor,
        ...(selected ? { boxShadow: `0 0 0 2px ${color}` } : {}),
      }}
    >
      <div
        className={cn('flex shrink-0 items-center justify-center rounded-full', s.icon)}
        style={{ backgroundColor: iconBgColor }}
      >
        <CategoryIcon
          name={icon}
          className={s.iconSize}
          style={{ color }}
        />
      </div>
      <span className={cn('font-medium', s.text)} style={{ color }}>
        {name}
      </span>
      {showAmount && amount && (
        <span className={cn('ml-auto font-semibold', s.text)} style={{ color }}>
          {amount}
        </span>
      )}
    </button>
  )
}
