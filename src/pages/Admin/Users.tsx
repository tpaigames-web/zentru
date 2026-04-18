import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, Crown, Clock, User as UserIcon, Calendar, Infinity as InfinityIcon, Undo } from 'lucide-react'
import { searchUsers, extendUserTrial, setUserPremium, type AdminUser } from '@/services/adminService'

export default function AdminUsers() {
  const { i18n } = useTranslation()
  const isZh = i18n.language.startsWith('zh')
  const [users, setUsers] = useState<AdminUser[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)

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
          onClick={() => setSelectedUser(null)}
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
                  {new Date(selectedUser.trial_ends_at).toLocaleDateString()}
                </p>
              )}
            </div>

            {/* Trial extension */}
            <div className="mt-5">
              <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                {isZh ? '延长试用' : 'Extend Trial'}
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => handleExtendTrial(selectedUser.id, 7)}
                  className="flex w-full items-center justify-between rounded-lg border px-4 py-2.5 text-sm hover:bg-accent"
                >
                  <span>{isZh ? '+ 7 天' : '+ 7 days'}</span>
                  <Calendar className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleExtendTrial(selectedUser.id, 30)}
                  className="flex w-full items-center justify-between rounded-lg border px-4 py-2.5 text-sm hover:bg-accent"
                >
                  <span>{isZh ? '+ 30 天' : '+ 30 days'}</span>
                  <Calendar className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleExtendTrial(selectedUser.id, 90)}
                  className="flex w-full items-center justify-between rounded-lg border px-4 py-2.5 text-sm hover:bg-accent"
                >
                  <span>{isZh ? '+ 90 天' : '+ 90 days'}</span>
                  <Calendar className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Premium management */}
            <div className="mt-5">
              <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                {isZh ? '付费管理（测试用）' : 'Premium Management (for testers)'}
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => handleSetPremium(selectedUser.id, 'permanent')}
                  className="flex w-full items-center justify-between rounded-lg border border-warning/30 bg-warning/5 px-4 py-2.5 text-sm hover:bg-warning/10"
                >
                  <span className="flex items-center gap-2">
                    <InfinityIcon className="h-4 w-4 text-warning" />
                    {isZh ? '永久 Premium（测试账号）' : 'Permanent Premium (tester)'}
                  </span>
                  <Crown className="h-4 w-4 text-warning" />
                </button>
                <button
                  onClick={() => handleSetPremium(selectedUser.id, '1year')}
                  className="flex w-full items-center justify-between rounded-lg border px-4 py-2.5 text-sm hover:bg-accent"
                >
                  <span>{isZh ? '付费 1 年（手动赠送）' : 'Premium 1 year (manual grant)'}</span>
                  <Crown className="h-4 w-4" />
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

            <button
              onClick={() => setSelectedUser(null)}
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
