import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Users, Crown, Clock, TrendingUp, FileText, Activity } from 'lucide-react'
import { getAdminStats, type AdminStats } from '@/services/adminService'

function StatCard({ icon: Icon, label, value, subtitle, color = '#3b82f6' }: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  label: string
  value: string | number
  subtitle?: string
  color?: string
}) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ backgroundColor: color + '15' }}
        >
          <Icon className="h-4 w-4" style={{ color }} />
        </div>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
    </div>
  )
}

export default function AdminDashboard() {
  const { i18n } = useTranslation()
  const isZh = i18n.language.startsWith('zh')
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAdminStats().then((s) => {
      setStats(s)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="rounded-xl border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">Failed to load stats</p>
      </div>
    )
  }

  const conversionRate = stats.total_users > 0
    ? ((stats.premium_users / stats.total_users) * 100).toFixed(1)
    : '0'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{isZh ? '仪表盘' : 'Dashboard'}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isZh ? 'Zentru 管理概览' : 'Zentru admin overview'}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          icon={Users}
          label={isZh ? '总用户' : 'Total Users'}
          value={stats.total_users}
          subtitle={isZh ? `本周 +${stats.new_users_7d}` : `+${stats.new_users_7d} this week`}
          color="#3b82f6"
        />
        <StatCard
          icon={Clock}
          label={isZh ? '试用中' : 'In Trial'}
          value={stats.users_in_trial}
          subtitle={isZh ? '90 天试用期' : 'Active 90-day trials'}
          color="#f59e0b"
        />
        <StatCard
          icon={Crown}
          label={isZh ? '付费用户' : 'Premium Users'}
          value={stats.premium_users}
          subtitle={isZh ? `${conversionRate}% 转化率` : `${conversionRate}% conversion`}
          color="#10b981"
        />
        <StatCard
          icon={TrendingUp}
          label={isZh ? '新增 (30天)' : 'New (30d)'}
          value={stats.new_users_30d}
          subtitle={isZh ? '增长' : 'Growth'}
          color="#8b5cf6"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <StatCard
          icon={Activity}
          label={isZh ? 'DAU (7天)' : 'DAU (7d)'}
          value={stats.dau_7d}
          subtitle={isZh ? '日活跃用户' : 'Daily active users'}
          color="#06b6d4"
        />
        <StatCard
          icon={Activity}
          label={isZh ? 'MAU (30天)' : 'MAU (30d)'}
          value={stats.mau_30d}
          subtitle={isZh ? '月活跃用户' : 'Monthly active users'}
          color="#ec4899"
        />
        <StatCard
          icon={FileText}
          label={isZh ? '样本' : 'Samples'}
          value={stats.total_samples}
          subtitle={isZh ? `本周 +${stats.samples_7d}` : `+${stats.samples_7d} this week`}
          color="#64748b"
        />
      </div>

      {/* Quick actions */}
      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <h2 className="text-sm font-semibold mb-3">{isZh ? '快速操作' : 'Quick Actions'}</h2>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <a href="/internal/ops/users" className="rounded-lg border px-3 py-2 text-xs hover:bg-accent transition-colors text-center">
            {isZh ? '管理用户' : 'Manage Users'}
          </a>
          <a href="/internal/ops/modules" className="rounded-lg border px-3 py-2 text-xs hover:bg-accent transition-colors text-center">
            {isZh ? '模块开关' : 'Toggle Modules'}
          </a>
          <a href="/internal/ops/samples" className="rounded-lg border px-3 py-2 text-xs hover:bg-accent transition-colors text-center">
            {isZh ? '审核样本' : 'Review Samples'}
          </a>
          <a href="/internal/ops/broadcasts" className="rounded-lg border px-3 py-2 text-xs hover:bg-accent transition-colors text-center">
            {isZh ? '发送公告' : 'Send Broadcast'}
          </a>
        </div>
      </div>
    </div>
  )
}
