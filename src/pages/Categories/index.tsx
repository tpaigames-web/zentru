import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Plus, Trash2, EyeOff, Eye } from 'lucide-react'
import { SortableList } from '@/components/shared/SortableList'
import { useCategoryStore } from '@/stores/useCategoryStore'
import { useTransactionStore } from '@/stores/useTransactionStore'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { CategoryIcon } from '@/components/shared/CategoryIcon'
import type { CategoryGroup } from '@/models/category'
import { cn } from '@/lib/utils'

const ICON_OPTIONS = [
  'Utensils', 'Car', 'ShoppingBag', 'Gamepad2', 'Home', 'Zap', 'Heart',
  'GraduationCap', 'Plane', 'Shirt', 'Smartphone', 'Gift', 'PawPrint',
  'Coffee', 'Fuel', 'Bus', 'Train', 'Bike', 'Dumbbell', 'Music',
  'Film', 'Book', 'Scissors', 'Baby', 'Dog', 'Stethoscope',
  'Banknote', 'Trophy', 'TrendingUp', 'Briefcase', 'RotateCcw',
  'Store', 'Wrench', 'Wifi', 'Phone', 'Tv', 'Umbrella',
  'MoreHorizontal',
]

const COLOR_OPTIONS = [
  '#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6',
  '#ec4899', '#06b6d4', '#14b8a6', '#f43f5e', '#a855f7',
  '#0ea5e9', '#eab308', '#d946ef', '#6366f1', '#64748b',
]

export default function CategoriesPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { categories, addCategory, updateCategory, deleteCategory } = useCategoryStore()
  const { transactions } = useTransactionStore()
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string; txCount: number } | null>(null)

  const [activeGroup, setActiveGroup] = useState<CategoryGroup>('expense')
  const [showForm, setShowForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newIcon, setNewIcon] = useState('MoreHorizontal')
  const [newColor, setNewColor] = useState('#3b82f6')

  const filteredCategories = categories.filter((c) => c.group === activeGroup)

  const handleAdd = async () => {
    if (!newName.trim()) return
    await addCategory({
      name: newName.trim(),
      group: activeGroup,
      icon: newIcon,
      color: newColor,
    })
    setNewName('')
    setShowForm(false)
  }

  const handleToggleActive = async (id: string, isActive: boolean) => {
    await updateCategory(id, { isActive: !isActive })
  }

  const handleDeleteRequest = async (id: string) => {
    const cat = categories.find((c) => c.id === id)
    const txCount = transactions.filter((tx) => tx.categoryId === id).length
    if (txCount === 0) {
      // No linked records — delete immediately
      await deleteCategory(id)
    } else {
      // Has linked records — show confirmation with countdown
      setDeleteConfirm({ id, name: cat?.nameKey ? t(cat.nameKey) : cat?.name || '', txCount })
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return
    await deleteCategory(deleteConfirm.id)
    setDeleteConfirm(null)
  }

  const inputClass = 'w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50'

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/settings')} className="rounded-full p-1 hover:bg-accent">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h2 className="text-xl md:text-2xl font-bold">{t('settings.categories')}</h2>
      </div>

      {/* Group tabs */}
      <div className="flex rounded-lg bg-muted p-1">
        {(['expense', 'income'] as const).map((g) => (
          <button
            key={g}
            onClick={() => setActiveGroup(g)}
            className={cn(
              'flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              activeGroup === g ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {t(`transactions.${g}`)}
          </button>
        ))}
      </div>

      {/* Category list — draggable */}
      <div className="rounded-xl border bg-card shadow-sm divide-y">
        <SortableList
          items={filteredCategories}
          onReorder={async (reordered) => {
            for (let i = 0; i < reordered.length; i++) {
              if (reordered[i].sortOrder !== i + 1) {
                await updateCategory(reordered[i].id, { sortOrder: i + 1 })
              }
            }
          }}
          renderItem={(cat) => (
            <div className={cn('flex items-center gap-3 px-2 py-3', !cat.isActive && 'opacity-40')}>
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: cat.color + '20' }}
              >
                <CategoryIcon name={cat.icon} className="h-4.5 w-4.5" style={{ color: cat.color }} />
              </div>
              <span className="flex-1 text-sm font-medium">
                {cat.nameKey ? t(cat.nameKey) : cat.name}
              </span>

              <button
                onClick={() => handleToggleActive(cat.id, cat.isActive)}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-accent transition-colors"
              >
                {cat.isActive ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              </button>

              <button
                onClick={() => handleDeleteRequest(cat.id)}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        />
      </div>

      {/* Add button */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed py-3 text-sm font-medium text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
        >
          <Plus className="h-4 w-4" />
          {t('categories.addCategory')}
        </button>
      ) : (
        <div className="rounded-xl border bg-card p-4 shadow-sm space-y-3">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className={inputClass}
            placeholder={t('categories.categoryName')}
            autoFocus
          />

          {/* Icon picker */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Icon</label>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
              {ICON_OPTIONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setNewIcon(icon)}
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-lg transition-all',
                    newIcon === icon ? 'bg-primary/10 ring-2 ring-primary' : 'hover:bg-accent',
                  )}
                >
                  <CategoryIcon name={icon} className="h-4 w-4" style={{ color: newIcon === icon ? newColor : undefined }} />
                </button>
              ))}
            </div>
          </div>

          {/* Color picker */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Color</label>
            <div className="flex flex-wrap gap-1.5">
              {COLOR_OPTIONS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setNewColor(color)}
                  className={cn(
                    'h-7 w-7 rounded-full transition-transform',
                    newColor === color && 'scale-125 ring-2 ring-offset-2 ring-primary',
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button onClick={() => setShowForm(false)} className="flex-1 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-accent transition-colors">
              {t('common.cancel')}
            </button>
            <button onClick={handleAdd} disabled={!newName.trim()} className="flex-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
              {t('common.save')}
            </button>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <ConfirmDialog
          title={t('categories.deleteTitle')}
          message={t('categories.deleteWithTx', { name: deleteConfirm.name, count: deleteConfirm.txCount })}
          confirmLabel={t('common.delete')}
          countdown={3}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  )
}
