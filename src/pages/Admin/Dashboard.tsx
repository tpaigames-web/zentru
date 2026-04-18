import { useEffect, useState } from 'react'
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
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Zentru admin overview</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          icon={Users}
          label="Total Users"
          value={stats.total_users}
          subtitle={`+${stats.new_users_7d} this week`}
          color="#3b82f6"
        />
        <StatCard
          icon={Clock}
          label="In Trial"
          value={stats.users_in_trial}
          subtitle="Active 90-day trials"
          color="#f59e0b"
        />
        <StatCard
          icon={Crown}
          label="Premium Users"
          value={stats.premium_users}
          subtitle={`${conversionRate}% conversion`}
          color="#10b981"
        />
        <StatCard
          icon={TrendingUp}
          label="New (30d)"
          value={stats.new_users_30d}
          subtitle="Growth"
          color="#8b5cf6"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <StatCard
          icon={Activity}
          label="DAU (7d)"
          value={stats.dau_7d}
          subtitle="Daily active users"
          color="#06b6d4"
        />
        <StatCard
          icon={Activity}
          label="MAU (30d)"
          value={stats.mau_30d}
          subtitle="Monthly active users"
          color="#ec4899"
        />
        <StatCard
          icon={FileText}
          label="Samples"
          value={stats.total_samples}
          subtitle={`+${stats.samples_7d} this week`}
          color="#64748b"
        />
      </div>

      {/* Quick actions */}
      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <h2 className="text-sm font-semibold mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <a href="/internal/ops/users" className="rounded-lg border px-3 py-2 text-xs hover:bg-accent transition-colors text-center">
            Manage Users
          </a>
          <a href="/internal/ops/modules" className="rounded-lg border px-3 py-2 text-xs hover:bg-accent transition-colors text-center">
            Toggle Modules
          </a>
          <a href="/internal/ops/samples" className="rounded-lg border px-3 py-2 text-xs hover:bg-accent transition-colors text-center">
            Review Samples
          </a>
          <a href="/internal/ops/broadcasts" className="rounded-lg border px-3 py-2 text-xs hover:bg-accent transition-colors text-center">
            Send Broadcast
          </a>
        </div>
      </div>
    </div>
  )
}
