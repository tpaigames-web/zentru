import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Plus, Trash2, EyeOff, Eye } from 'lucide-react'
import { useAccountStore } from '@/stores/useAccountStore'
import { CategoryIcon } from '@/components/shared/CategoryIcon'
import { SortableList } from '@/components/shared/SortableList'
import type { AccountType } from '@/models/account'
import { cn } from '@/lib/utils'

const TYPE_OPTIONS: { value: AccountType; labelKey: string }[] = [
  { value: 'cash', labelKey: 'payment.cash' },
  { value: 'ewallet', labelKey: 'payment.ewallet' },
  { value: 'debit', labelKey: 'payment.debit' },
  { value: 'other', labelKey: 'payment.other' },
]

const ICON_OPTIONS = [
  'Smartphone', 'Banknote', 'Building2', 'Wallet', 'CreditCard',
  'QrCode', 'Globe', 'Send', 'Coins', 'CircleDollarSign',
]

const COLOR_OPTIONS = [
  '#3b82f6', '#22c55e', '#ef4444', '#f59e0b', '#8b5cf6',
  '#ec4899', '#06b6d4', '#f43f5e', '#6366f1', '#64748b',
]

export default function PaymentMethodsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { accounts, addAccount, updateAccount, deleteAccount } = useAccountStore()

  const [showForm, setShowForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState<AccountType>('ewallet')
  const [newIcon, setNewIcon] = useState('Smartphone')
  const [newColor, setNewColor] = useState('#3b82f6')

  // Filter out credit-card linked accounts (those are managed in Cards page)
  const paymentMethods = accounts.filter((a) => a.type !== 'credit')

  const handleAdd = async () => {
    if (!newName.trim()) return
    await addAccount({
      name: newName.trim(),
      type: newType,
      icon: newIcon,
      color: newColor,
    })
    setNewName('')
    setShowForm(false)
  }

  const handleToggle = async (id: string, isActive: boolean) => {
    await updateAccount(id, { isActive: !isActive })
  }

  const handleDelete = async (id: string, isDefault: boolean) => {
    if (isDefault) {
      await updateAccount(id, { isActive: false })
    } else {
      await deleteAccount(id)
    }
  }

  const inputClass = 'w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50'

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/settings')} className="rounded-full p-1 hover:bg-accent">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h2 className="text-xl md:text-2xl font-bold">{t('payment.title')}</h2>
      </div>

      {/* Payment methods list — draggable */}
      <div className="rounded-xl border bg-card shadow-sm divide-y">
        <SortableList
          items={paymentMethods}
          onReorder={async (reordered) => {
            for (let i = 0; i < reordered.length; i++) {
              await updateAccount(reordered[i].id, {})
            }
          }}
          renderItem={(acc) => (
            <div className={cn('flex items-center gap-3 px-2 py-3', !acc.isActive && 'opacity-40')}>
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: (acc.color || '#64748b') + '20' }}
              >
                <CategoryIcon name={acc.icon || 'Wallet'} className="h-4.5 w-4.5" style={{ color: acc.color || '#64748b' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{acc.name}</p>
                <p className="text-xs text-muted-foreground">{t(`payment.${acc.type}`)}</p>
              </div>

              <button
                onClick={() => handleToggle(acc.id, acc.isActive)}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-accent transition-colors"
              >
                {acc.isActive ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              </button>

              {!acc.isDefault && (
                <button
                  onClick={() => handleDelete(acc.id, acc.isDefault)}
                  className="rounded-full p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}
        />
      </div>

      {/* Add form */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed py-3 text-sm font-medium text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
        >
          <Plus className="h-4 w-4" />
          {t('payment.addMethod')}
        </button>
      ) : (
        <div className="rounded-xl border bg-card p-4 shadow-sm space-y-3">
          <input value={newName} onChange={(e) => setNewName(e.target.value)} className={inputClass} placeholder={t('payment.methodName')} autoFocus />

          <select value={newType} onChange={(e) => setNewType(e.target.value as AccountType)} className={inputClass}>
            {TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{t(opt.labelKey)}</option>
            ))}
          </select>

          {/* Icon picker */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Icon</label>
            <div className="flex flex-wrap gap-1.5">
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
                  className={cn('h-7 w-7 rounded-full transition-transform', newColor === color && 'scale-125 ring-2 ring-offset-2 ring-primary')}
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
    </div>
  )
}
