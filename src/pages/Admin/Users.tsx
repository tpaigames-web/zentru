import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, Crown, Clock, User as UserIcon, Calendar, Infinity as InfinityIcon, Undo, Timer } from 'lucide-react'
import { searchUsers, extendUserTrial, setUserPremium, setUserTrialEndsAt, type AdminUser } from '@/services/adminService'

export default function AdminUsers() {
  const { i18n } = useTranslation()
  const isZh = i18n.language.startsWith('zh')
  const [users, setUsers] = useState<AdminUser[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [customTrialDate, setCustomTrialDate] = useState('')
  const [customPremiumDate, setCustomPremiumDate] = useState('')

  useEffect(() => {
    loadUsers('')
  }, [])

  const loadUsers = async (q: string) => {
    setLoading(true)
    const result = await searchUsers(q, 100)
    setUsers(result)
    setLoading(false)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    loadUsers(query)
  }

  const handleExtendTrial = async (userId: string, days: number) => {
    const ok = await extendUserTrial(userId, days)
    if (ok) {
      alert(isZh ? `已延长试用 ${days} 天` : `Trial extended by ${days} days`)
      loadUsers(query)
      setSelectedUser(null)
    } else {
      alert(isZh ? '延长失败' : 'Failed to extend trial')
    }
  }

  /**
   * Set trial to expire a specific number of milliseconds from now.
   * Useful for precise testing: e.g. 60*1000 = 1 minute, 24*3600*1000 = 1 day.
   */
  const handleSetTrialDuration = async (userId: string, ms: number, label: string) => {
    const iso = new Date(Date.now() + ms).toISOString()
    const ok = await setUserTrialEndsAt(userId, iso)
    if (ok) {
      alert(isZh ? `✓ 试用将在 ${label} 后到期\n(${new Date(iso).toLocaleString()})` : `✓ Trial will expire in ${label}\n(${new Date(iso).toLocaleString()})`)
      loadUsers(query)
      setSelectedUser(null)
    } else {
      alert(isZh ? '设置失败' : 'Failed to set')
    }
  }

  /** Set trial to a specific datetime (from the <input type=datetime-local>) */
  const handleSetCustomTrial = async (userId: string) => {
    if (!customTrialDate) {
      alert(isZh ? '请选择时间' : 'Please pick a date/time')
      return
    }
    const iso = new Date(customTrialDate).toISOString()
    const ok = await setUserTrialEndsAt(userId, iso)
    if (ok) {
      alert(isZh ? `✓ 试用到期已设为 ${new Date(iso).toLocaleString()}` : `✓ Trial end set to ${new Date(iso).toLocaleString()}`)
      setCustomTrialDate('')
      loadUsers(query)
      setSelectedUser(null)
    } else {
      alert(isZh ? '设置失败' : 'Failed')
    }
  }

  /** Set a short Premium subscription for testing (e.g. 1 day / 1 hour Premium) */
  const handleSetPremiumDuration = async (userId: string, ms: number, label: string) => {
    const iso = new Date(Date.now() + ms).toISOString()
    const ok = await setUserPremium(userId, 'premium', iso)
    if (ok) {
      alert(isZh ? `✓ Premium 将在 ${label} 后到期\n(${new Date(iso).toLocaleString()})` : `✓ Premium expires in ${label}\n(${new Date(iso).toLocaleString()})`)
      loadUsers(query)
      setSelectedUser(null)
    } else {
      alert(isZh ? '设置失败' : 'Failed')
    }
  }

  /** Set premium to a specific datetime */
  const handleSetCustomPremium = async (userId: string) => {
    if (!customPremiumDate) {
      alert(isZh ? '请选择时间' : 'Please pick a date/time')
      return
    }
    const iso = new Date(customPremiumDate).toISOString()
    const ok = await setUserPremium(userId, 'premium', iso)
    if (ok) {
      alert(isZh ? `✓ Premium 到期已设为 ${new Date(iso).toLocaleString()}` : `✓ Premium expires at ${new Date(iso).toLocaleString()}`)
      setCustomPremiumDate('')
      loadUsers(query)
      setSelectedUser(null)
    } else {
      alert(isZh ? '设置失败' : 'Failed')
    }
  }

  const handleSetPremium = async (userId: string, mode: 'permanent' | '1year' | 'revoke') => {
    let plan: 'free' | 'premium' = 'premium'
    let expiresAt: string | null = null
    let confirmMsg = ''

    if (mode === 'permanent') {
      plan = 'premium'
      expiresAt = null
      confirmMsg = isZh ? '设为永久 Premium？（测试账号用）' : 'Set as permanent Premium? (for testers)'
    } else if (mode === '1year') {
      plan = 'premium'
      const d = new Date()
      d.setFullYear(d.getFullYear() + 1)
      expiresAt = d.toISOString()
      confirmMsg = isZh ? '设为付费 1 年？' : 'Set as Premium for 1 year?'
    } else {
      plan = 'free'
      expiresAt = null
      confirmMsg = isZh ? '撤销 Premium，降级为免费？' : 'Revoke Premium and downgrade to Free?'
    }

    if (!confirm(confirmMsg)) return

    const ok = await setUserPremium(userId, plan, expiresAt)
    if (ok) {
      alert(isZh ? '✓ 已更新' : '✓ Updated')
      loadUsers(query)
      setSelectedUser(null)
    } else {
      alert(isZh ? '更新失败' : 'Failed to update')
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">{isZh ? '用户管理' : 'Users'}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isZh ? `找到 ${users.length} 个用户` : `${users.length} users found`}
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={isZh ? '搜索邮箱或姓名...' : 'Search by email or name...'}
            className="w-full rounded-lg border bg-card pl-10 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
          {isZh ? '搜索' : 'Search'}
        </button>
      </form>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 text-left">
                <tr>
                  <th className="px-4 py-2 font-medium">{isZh ? '用户' : 'User'}</th>
                  <th className="px-4 py-2 font-medium">{isZh ? '套餐' : 'Plan'}</th>
                  <th className="px-4 py-2 font-medium">{isZh ? '角色' : 'Role'}</th>
                  <th className="px-4 py-2 font-medium">{isZh ? '试用到期' : 'Trial Ends'}</th>
                  <th className="px-4 py-2 font-medium">{isZh ? '注册日期' : 'Joined'}</th>
                  <th className="px-4 py-2 font-medium">{isZh ? '操作' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const inTrial = u.trial_ends_at && new Date(u.trial_ends_at) > new Date()
                  return (
                    <tr key={u.id} className="border-t hover:bg-accent/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <UserIcon className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{u.display_name || 'No name'}</p>
                            <p className="text-xs text-muted-foreground">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {u.plan === 'premium' ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5 text-xs font-medium text-warning">
                            <Crown className="h-3 w-3" /> {isZh ? '付费' : 'Premium'}
                          </span>
                        ) : inTrial ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
                            <Clock className="h-3 w-3" /> {isZh ? '试用' : 'Trial'}
                          </span>
                        ) : (
                          <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{isZh ? '免费' : 'Free'}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded px-2 py-0.5 text-xs ${
                          u.role === 'super_admin' ? 'bg-red-500/15 text-red-600' :
                          u.role === 'admin' ? 'bg-orange-500/15 text-orange-600' :
                          u.role === 'support' ? 'bg-blue-500/15 text-blue-600' :
                          'bg-muted'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {u.trial_ends_at ? new Date(u.trial_ends_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelectedUser(u)}
                          className="text-xs text-primary hover:underline"
                        >
                          {isZh ? '管理' : 'Manage'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* User action modal */}
      {selectedUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => { setSelectedUser(null); setCustomTrialDate(''); setCustomPremiumDate('') }}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold">{selectedUser.display_name}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{selectedUser.email}</p>

            <div className="mt-3 text-xs text-muted-foreground space-y-0.5">
              <p>
                <span className="font-medium">{isZh ? '当前套餐：' : 'Current plan: '}</span>
                <span className={selectedUser.plan === 'premium' ? 'text-warning font-semibold' : ''}>
                  {selectedUser.plan}
                </span>
              </p>
              {selectedUser.trial_ends_at && (
                <p>
                  <span className="font-medium">{isZh ? '试用到期：' : 'Trial ends: '}</span>
                  {new Date(selectedUser.trial_ends_at).toLocaleString()}
                </p>
              )}
            </div>

            {/* Trial extension */}
            <div className="mt-5">
              <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                {isZh ? '延长试用' : 'Extend Trial'}
              </p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleExtendTrial(selectedUser.id, 7)}
                  className="rounded-lg border px-2 py-2 text-xs hover:bg-accent"
                >
                  + 7 {isZh ? '天' : 'days'}
                </button>
                <button
                  onClick={() => handleExtendTrial(selectedUser.id, 30)}
                  className="rounded-lg border px-2 py-2 text-xs hover:bg-accent"
                >
                  + 30 {isZh ? '天' : 'days'}
                </button>
                <button
                  onClick={() => handleExtendTrial(selectedUser.id, 90)}
                  className="rounded-lg border px-2 py-2 text-xs hover:bg-accent"
                >
                  + 90 {isZh ? '天' : 'days'}
                </button>
              </div>
            </div>

            {/* Short-duration testing presets (trial) */}
            <div className="mt-5 rounded-lg border border-primary/20 bg-primary/5 p-3">
              <p className="flex items-center gap-1 text-xs font-semibold uppercase text-primary mb-2">
                <Timer className="h-3 w-3" />
                {isZh ? '测试用：快速到期（试用）' : 'Testing: Quick Expire (Trial)'}
              </p>
              <p className="text-[10px] text-muted-foreground mb-2">
                {isZh ? '设置从现在开始的短时长，便于测试 Paywall 和到期流程' : 'Set short durations from now for Paywall/expiry testing'}
              </p>
              <div className="grid grid-cols-4 gap-1.5">
                <button
                  onClick={() => handleSetTrialDuration(selectedUser.id, 2 * 60 * 1000, isZh ? '2 分钟' : '2 min')}
                  className="rounded-md border bg-background px-2 py-1.5 text-[11px] font-medium hover:bg-accent"
                >
                  2 {isZh ? '分钟' : 'min'}
                </button>
                <button
                  onClick={() => handleSetTrialDuration(selectedUser.id, 60 * 60 * 1000, isZh ? '1 小时' : '1 hr')}
                  className="rounded-md border bg-background px-2 py-1.5 text-[11px] font-medium hover:bg-accent"
                >
                  1 {isZh ? '小时' : 'hr'}
                </button>
                <button
                  onClick={() => handleSetTrialDuration(selectedUser.id, 24 * 60 * 60 * 1000, isZh ? '1 天' : '1 day')}
                  className="rounded-md border bg-background px-2 py-1.5 text-[11px] font-medium hover:bg-accent"
                >
                  1 {isZh ? '天' : 'day'}
                </button>
                <button
                  onClick={() => handleSetTrialDuration(selectedUser.id, 3 * 24 * 60 * 60 * 1000, isZh ? '3 天' : '3 days')}
                  className="rounded-md border bg-background px-2 py-1.5 text-[11px] font-medium hover:bg-accent"
                >
                  3 {isZh ? '天' : 'days'}
                </button>
              </div>
              <div className="mt-2.5 flex gap-1.5">
                <input
                  type="datetime-local"
                  value={customTrialDate}
                  onChange={(e) => setCustomTrialDate(e.target.value)}
                  className="flex-1 rounded-md border bg-background px-2 py-1.5 text-[11px] outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  onClick={() => handleSetCustomTrial(selectedUser.id)}
                  disabled={!customTrialDate}
                  className="rounded-md bg-primary px-3 py-1.5 text-[11px] font-medium text-primary-foreground disabled:opacity-40"
                >
                  {isZh ? '设定' : 'Set'}
                </button>
              </div>
              {selectedUser.trial_ends_at && (
                <button
                  onClick={() => handleSetTrialDuration(selectedUser.id, -60 * 1000, isZh ? '已过期' : 'expired')}
                  className="mt-2 w-full rounded-md border border-destructive/30 bg-destructive/5 px-2 py-1.5 text-[11px] font-medium text-destructive hover:bg-destructive/10"
                >
                  {isZh ? '⚡ 立即过期（1 分钟前）' : '⚡ Expire Now (-1 min)'}
                </button>
              )}
            </div>

            {/* Premium management */}
            <div className="mt-5">
              <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                {isZh ? '付费管理' : 'Premium Management'}
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => handleSetPremium(selectedUser.id, 'permanent')}
                  className="flex w-full items-center justify-between rounded-lg border border-warning/30 bg-warning/5 px-4 py-2.5 text-sm hover:bg-warning/10"
                >
                  <span className="flex items-center gap-2">
                    <InfinityIcon className="h-4 w-4 text-warning" />
                    {isZh ? '永久 Premium' : 'Permanent Premium'}
                  </span>
                  <Crown className="h-4 w-4 text-warning" />
                </button>
                <button
                  onClick={() => handleSetPremium(selectedUser.id, '1year')}
                  className="flex w-full items-center justify-between rounded-lg border px-4 py-2.5 text-sm hover:bg-accent"
                >
                  <span className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {isZh ? '付费 1 年' : 'Premium 1 year'}
                  </span>
                </button>
                {selectedUser.plan === 'premium' && (
                  <button
                    onClick={() => handleSetPremium(selectedUser.id, 'revoke')}
                    className="flex w-full items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10"
                  >
                    <span className="flex items-center gap-2">
                      <Undo className="h-4 w-4" />
                      {isZh ? '撤销 Premium → 免费' : 'Revoke Premium → Free'}
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* Short-duration testing presets (Premium) */}
            <div className="mt-5 rounded-lg border border-warning/20 bg-warning/5 p-3">
              <p className="flex items-center gap-1 text-xs font-semibold uppercase text-warning mb-2">
                <Timer className="h-3 w-3" />
                {isZh ? '测试用：快速到期（Premium）' : 'Testing: Quick Expire (Premium)'}
              </p>
              <p className="text-[10px] text-muted-foreground mb-2">
                {isZh ? '赠送短期 Premium 便于测试到期降级流程' : 'Grant short Premium for expiry/downgrade testing'}
              </p>
              <div className="grid grid-cols-4 gap-1.5">
                <button
                  onClick={() => handleSetPremiumDuration(selectedUser.id, 2 * 60 * 1000, isZh ? '2 分钟' : '2 min')}
                  className="rounded-md border bg-background px-2 py-1.5 text-[11px] font-medium hover:bg-accent"
                >
                  2 {isZh ? '分钟' : 'min'}
                </button>
                <button
                  onClick={() => handleSetPremiumDuration(selectedUser.id, 60 * 60 * 1000, isZh ? '1 小时' : '1 hr')}
                  className="rounded-md border bg-background px-2 py-1.5 text-[11px] font-medium hover:bg-accent"
                >
                  1 {isZh ? '小时' : 'hr'}
                </button>
                <button
                  onClick={() => handleSetPremiumDuration(selectedUser.id, 24 * 60 * 60 * 1000, isZh ? '1 天' : '1 day')}
                  className="rounded-md border bg-background px-2 py-1.5 text-[11px] font-medium hover:bg-accent"
                >
                  1 {isZh ? '天' : 'day'}
                </button>
                <button
                  onClick={() => handleSetPremiumDuration(selectedUser.id, 7 * 24 * 60 * 60 * 1000, isZh ? '7 天' : '7 days')}
                  className="rounded-md border bg-background px-2 py-1.5 text-[11px] font-medium hover:bg-accent"
                >
                  7 {isZh ? '天' : 'days'}
                </button>
              </div>
              <div className="mt-2.5 flex gap-1.5">
                <input
                  type="datetime-local"
                  value={customPremiumDate}
                  onChange={(e) => setCustomPremiumDate(e.target.value)}
                  className="flex-1 rounded-md border bg-background px-2 py-1.5 text-[11px] outline-none focus:ring-1 focus:ring-warning"
                />
                <button
                  onClick={() => handleSetCustomPremium(selectedUser.id)}
                  disabled={!customPremiumDate}
                  className="rounded-md bg-warning px-3 py-1.5 text-[11px] font-medium text-white disabled:opacity-40"
                >
                  {isZh ? '设定' : 'Set'}
                </button>
              </div>
            </div>

            <button
              onClick={() => { setSelectedUser(null); setCustomTrialDate(''); setCustomPremiumDate('') }}
              className="mt-5 w-full rounded-lg bg-muted px-4 py-2 text-sm font-medium"
            >
              {isZh ? '关闭' : 'Close'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
