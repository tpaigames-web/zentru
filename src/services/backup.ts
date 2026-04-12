import { db } from '@/data/dexie/DexieDatabase'

export interface BackupData {
  version: number
  exportedAt: number
  cards: unknown[]
  accounts: unknown[]
  transactions: unknown[]
  categories: unknown[]
  budgets: unknown[]
  recurringTransactions: unknown[]
  payments: unknown[]
}

export async function exportFullBackup(): Promise<BackupData> {
  const [cards, accounts, transactions, categories, budgets, recurringTransactions, payments] = await Promise.all([
    db.cards.toArray(),
    db.accounts.toArray(),
    db.transactions.toArray(),
    db.categories.toArray(),
    db.budgets.toArray(),
    db.recurringTransactions.toArray(),
    db.payments.toArray(),
  ])

  return {
    version: 2,
    exportedAt: Date.now(),
    cards,
    accounts,
    transactions,
    categories,
    budgets,
    recurringTransactions,
    payments,
  }
}

export async function importFullBackup(data: BackupData): Promise<{ counts: Record<string, number> }> {
  const counts: Record<string, number> = {}

  await db.transaction('rw', [db.cards, db.accounts, db.transactions, db.categories, db.budgets, db.recurringTransactions, db.payments], async () => {
    // Clear existing data
    await Promise.all([
      db.cards.clear(),
      db.accounts.clear(),
      db.transactions.clear(),
      db.categories.clear(),
      db.budgets.clear(),
      db.recurringTransactions.clear(),
      db.payments.clear(),
    ])

    // Import new data
    if (data.cards?.length) {
      await db.cards.bulkAdd(data.cards as never[])
      counts.cards = data.cards.length
    }
    if (data.accounts?.length) {
      await db.accounts.bulkAdd(data.accounts as never[])
      counts.accounts = data.accounts.length
    }
    if (data.transactions?.length) {
      await db.transactions.bulkAdd(data.transactions as never[])
      counts.transactions = data.transactions.length
    }
    if (data.categories?.length) {
      await db.categories.bulkAdd(data.categories as never[])
      counts.categories = data.categories.length
    }
    if (data.budgets?.length) {
      await db.budgets.bulkAdd(data.budgets as never[])
      counts.budgets = data.budgets.length
    }
    if (data.recurringTransactions?.length) {
      await db.recurringTransactions.bulkAdd(data.recurringTransactions as never[])
      counts.recurringTransactions = data.recurringTransactions.length
    }
    if (data.payments?.length) {
      await db.payments.bulkAdd(data.payments as never[])
      counts.payments = data.payments.length
    }
  })

  return { counts }
}

export function exportTransactionsCSV(transactions: { date: number; type: string; amount: number; currency: string; merchant?: string; notes?: string; cashbackAmount?: number }[]): string {
  const header = 'Date,Type,Amount,Currency,Merchant,Notes,Cashback'
  const rows = transactions.map((tx) => {
    const date = new Date(tx.date).toISOString().split('T')[0]
    const merchant = (tx.merchant || '').replace(/,/g, ';')
    const notes = (tx.notes || '').replace(/,/g, ';')
    return `${date},${tx.type},${tx.amount},${tx.currency},${merchant},${notes},${tx.cashbackAmount || 0}`
  })
  return [header, ...rows].join('\n')
}

export function downloadFile(content: string, filename: string, type = 'application/json') {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
