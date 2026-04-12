export type CurrencyCode = 'MYR' | 'CNY' | 'USD' | 'SGD' | 'THB' | 'IDR' | 'PHP' | 'JPY' | 'KRW' | 'EUR' | 'GBP' | 'AUD' | 'HKD' | 'TWD'

export const CURRENCIES: { code: CurrencyCode; symbol: string; nameKey: string }[] = [
  { code: 'MYR', symbol: 'RM', nameKey: 'common.currency.MYR' },
  { code: 'CNY', symbol: '¥', nameKey: 'common.currency.CNY' },
  { code: 'USD', symbol: '$', nameKey: 'common.currency.USD' },
  { code: 'SGD', symbol: 'S$', nameKey: 'common.currency.SGD' },
  { code: 'THB', symbol: '฿', nameKey: 'common.currency.THB' },
  { code: 'IDR', symbol: 'Rp', nameKey: 'common.currency.IDR' },
  { code: 'PHP', symbol: '₱', nameKey: 'common.currency.PHP' },
  { code: 'JPY', symbol: '¥', nameKey: 'common.currency.JPY' },
  { code: 'KRW', symbol: '₩', nameKey: 'common.currency.KRW' },
  { code: 'EUR', symbol: '€', nameKey: 'common.currency.EUR' },
  { code: 'GBP', symbol: '£', nameKey: 'common.currency.GBP' },
  { code: 'AUD', symbol: 'A$', nameKey: 'common.currency.AUD' },
  { code: 'HKD', symbol: 'HK$', nameKey: 'common.currency.HKD' },
  { code: 'TWD', symbol: 'NT$', nameKey: 'common.currency.TWD' },
]

const formatters: Record<string, Intl.NumberFormat> = {}

function getFormatter(currency: string, locale: string): Intl.NumberFormat {
  const key = `${currency}-${locale}`
  if (!formatters[key]) {
    formatters[key] = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }
  return formatters[key]
}

export function formatAmount(amount: number, currency: string = 'MYR', locale = 'ms-MY'): string {
  return getFormatter(currency, locale).format(amount)
}

export function formatAmountShort(amount: number): string {
  if (Math.abs(amount) >= 10000) {
    return `${(amount / 10000).toFixed(1)}W`
  }
  return amount.toFixed(0)
}
