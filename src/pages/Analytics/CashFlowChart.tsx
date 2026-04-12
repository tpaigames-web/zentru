import { useTranslation } from 'react-i18next'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import type { CashFlowPoint } from '@/services/analytics'
import { formatAmount } from '@/lib/currency'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { EXPENSE_COLOR, INCOME_COLOR } from '@/styles/chartTheme'

interface CashFlowChartProps {
  data: CashFlowPoint[]
}

export function CashFlowChart({ data }: CashFlowChartProps) {
  const { t } = useTranslation()
  const currency = useSettingsStore((s) => s.currency)

  if (data.every((d) => d.income === 0 && d.expense === 0)) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        {t('common.noData')}
      </div>
    )
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
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
              name === 'income' ? t('transactions.income') : t('transactions.expense'),
            ]}
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              fontSize: '12px',
            }}
          />
          <ReferenceLine y={0} stroke="hsl(var(--border))" />
          <Bar dataKey="income" fill={INCOME_COLOR} radius={[4, 4, 0, 0]} barSize={20} />
          <Bar dataKey="expense" fill={EXPENSE_COLOR} radius={[4, 4, 0, 0]} barSize={20} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
