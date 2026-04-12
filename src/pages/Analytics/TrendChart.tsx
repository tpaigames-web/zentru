import { useTranslation } from 'react-i18next'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { TrendPoint } from '@/services/analytics'
import { formatAmount } from '@/lib/currency'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { EXPENSE_COLOR, INCOME_COLOR } from '@/styles/chartTheme'

interface TrendChartProps {
  data: TrendPoint[]
}

export function TrendChart({ data }: TrendChartProps) {
  const { t } = useTranslation()
  const currency = useSettingsStore((s) => s.currency)

  if (data.every((d) => d.expense === 0 && d.income === 0)) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        {t('common.noData')}
      </div>
    )
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(value, name) => [
              formatAmount(Number(value), currency),
              name === 'expense' ? t('transactions.expense') : t('transactions.income'),
            ]}
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              fontSize: '12px',
            }}
          />
          <Area
            type="monotone"
            dataKey="expense"
            stroke={EXPENSE_COLOR}
            fill={EXPENSE_COLOR}
            fillOpacity={0.15}
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="income"
            stroke={INCOME_COLOR}
            fill={INCOME_COLOR}
            fillOpacity={0.15}
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
