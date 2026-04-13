import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Plus, CreditCard, ScanLine } from 'lucide-react'
import { useCardStore } from '@/stores/useCardStore'
import { usePaymentStore } from '@/stores/usePaymentStore'
import { useTransactionStore } from '@/stores/useTransactionStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { getMonthRange } from '@/lib/date'
import type { CreditCard as CreditCardType } from '@/models/card'
import { CardForm } from './CardForm'
import { CardItem } from './CardItem'
import { PaymentForm } from './PaymentForm'
import { PaymentHistory } from './PaymentHistory'
import { ScanCard } from './ScanCard'
import type { ScannedCardData } from '@/services/cardScanner'

export default function CardsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { cards, addCard, updateCard, deleteCard } = useCardStore()
  const { addPayment } = usePaymentStore()
  const { transactions } = useTransactionStore()
  const currency = useSettingsStore((s) => s.currency)

  // Compute cashback info per card for this month
  const { start, end } = getMonthRange()
  const cardCashbackMap = useMemo(() => {
    const map = new Map<string, { earned: number; totalCap: number | null; capReached: boolean; rulesCount: number }>()
    for (const card of cards) {
      if (!card.cashbackRules?.length) continue
      const cardTx = transactions.filter((tx) => tx.cardId === card.id && tx.date >= start && tx.date <= end)
      const earned = cardTx.reduce((s, tx) => s + (tx.cashbackAmount || 0), 0)
      const totalCap = card.totalMonthlyCashbackCap || null
      const capReached = totalCap ? earned >= totalCap * 0.9 : false
      map.set(card.id, { earned, totalCap, capReached, rulesCount: card.cashbackRules.length })
    }
    return map
  }, [cards, transactions, start, end])

  const [showForm, setShowForm] = useState(false)
  const [editingCard, setEditingCard] = useState<CreditCardType | undefined>()
  const [payingCard, setPayingCard] = useState<CreditCardType | undefined>()
  const [historyCard, setHistoryCard] = useState<CreditCardType | undefined>()
  const [showScanner, setShowScanner] = useState(false)
  const [scannedData, setScannedData] = useState<ScannedCardData | undefined>()

  const handleAdd = () => {
    setEditingCard(undefined)
    setScannedData(undefined)
    setShowForm(true)
  }

  const handleScanResult = (data: ScannedCardData) => {
    setScannedData(data)
    setShowScanner(false)
    setEditingCard(undefined)
    setShowForm(true)
  }

  const handleEdit = (card: CreditCardType) => {
    setEditingCard(card)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    await deleteCard(id)
  }

  const handleSubmit = async (data: Record<string, unknown>) => {
    if (editingCard) {
      await updateCard(editingCard.id, data)
    } else {
      await addCard({
        ...(data as Omit<CreditCardType, 'id' | 'createdAt' | 'updatedAt'>),
        currency,
        isActive: true,
        notes: '',
      })
    }
    setShowForm(false)
    setEditingCard(undefined)
  }

  const handlePayment = async (data: { cardId: string; amount: number; date: number; notes?: string }) => {
    await addPayment(data)
    setPayingCard(undefined)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl md:text-2xl font-bold">{t('cards.title')}</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowScanner(true)}
            className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-accent transition-colors"
          >
            <ScanLine className="h-4 w-4" />
            {t('cards.scan.title')}
          </button>
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            {t('cards.addCard')}
          </button>
        </div>
      </div>

      {cards.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border bg-card py-16 shadow-sm">
          <CreditCard className="mb-4 h-12 w-12 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">{t('cards.noCards')}</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {cards.map((card) => (
            <CardItem
              key={card.id}
              card={card}
              cashbackInfo={cardCashbackMap.get(card.id)}
              onClick={(c) => navigate(`/cards/${c.id}`)}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onPayment={setPayingCard}
              onPaymentHistory={setHistoryCard}
            />
          ))}
        </div>
      )}

      {showForm && (
        <CardForm
          card={editingCard}
          scannedData={scannedData}
          onSubmit={handleSubmit}
          onClose={() => { setShowForm(false); setEditingCard(undefined); setScannedData(undefined) }}
        />
      )}

      {showScanner && (
        <ScanCard
          onResult={handleScanResult}
          onClose={() => setShowScanner(false)}
        />
      )}

      {payingCard && (
        <PaymentForm
          card={payingCard}
          onSubmit={handlePayment}
          onClose={() => setPayingCard(undefined)}
        />
      )}

      {historyCard && (
        <PaymentHistory
          card={historyCard}
          onClose={() => setHistoryCard(undefined)}
        />
      )}
    </div>
  )
}
