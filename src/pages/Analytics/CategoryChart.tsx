import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import type { CategoryTotal } from '@/services/analytics'
import { formatAmount } from '@/lib/currency'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { CategoryIcon } from '@/components/shared/CategoryIcon'

interface CategoryChartProps {
  data: CategoryTotal[]
}

export function CategoryChart({ data }: CategoryChartProps) {
  const { t } = useTranslation()
  const currency = useSettingsStore((s) => s.currency)

  const chartData = useMemo(
    () => data.map((d) => ({ ...d, displayName: d.nameKey ? t(d.nameKey) : d.name })),
    [data, t],
  )

  const total = data.reduce((s, d) => s + d.total, 0)

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        {t('common.noData')}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Pie Chart */}
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              dataKey="total"
              nameKey="displayName"
              strokeWidth={2}
              stroke="hsl(var(--card))"
            >
              {chartData.map((entry) => (
                <Cell key={entry.categoryId} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => formatAmount(Number(value), currency)}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Category list */}
      <div className="space-y-2">
        {chartData.slice(0, 8).map((item) => (
          <div key={item.categoryId} className="flex items-center gap-3">
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: item.color + '20' }}
            >
              <CategoryIcon name={item.icon} className="h-4 w-4" style={{ color: item.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium truncate">{item.displayName}</span>
                <span className="text-sm font-semibold">{formatAmount(item.total, currency)}</span>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <div className="h-1.5 flex-1 rounded-full bg-muted">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-10 text-right">{item.percentage.toFixed(0)}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="flex items-center justify-between border-t pt-3">
        <span className="text-sm font-medium text-muted-foreground">{t('common.all')}</span>
        <span className="text-base font-bold">{formatAmount(total, currency)}</span>
      </div>
    </div>
  )
}
