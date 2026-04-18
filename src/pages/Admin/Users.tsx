import { useEffect, useState } from 'react'
import { Search, Crown, Clock, User as UserIcon, Calendar } from 'lucide-react'
import { searchUsers, extendUserTrial, type AdminUser } from '@/services/adminService'

export default function AdminUsers() {
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
      alert(`Trial extended by ${days} days`)
      loadUsers(query)
      setSelectedUser(null)
    } else {
      alert('Failed to extend trial')
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="mt-1 text-sm text-muted-foreground">{users.length} users found</p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by email or name..."
            className="w-full rounded-lg border bg-card pl-10 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
          Search
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
                  <th className="px-4 py-2 font-medium">User</th>
                  <th className="px-4 py-2 font-medium">Plan</th>
                  <th className="px-4 py-2 font-medium">Role</th>
                  <th className="px-4 py-2 font-medium">Trial Ends</th>
                  <th className="px-4 py-2 font-medium">Joined</th>
                  <th className="px-4 py-2 font-medium">Actions</th>
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
                            <Crown className="h-3 w-3" /> Premium
                          </span>
                        ) : inTrial ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
                            <Clock className="h-3 w-3" /> Trial
                          </span>
                        ) : (
                          <span className="rounded-full bg-muted px-2 py-0.5 text-xs">Free</span>
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
                          Manage
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
            className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold">{selectedUser.display_name}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{selectedUser.email}</p>

            <div className="mt-4 space-y-2">
              <button
                onClick={() => handleExtendTrial(selectedUser.id, 7)}
                className="flex w-full items-center justify-between rounded-lg border px-4 py-2.5 text-sm hover:bg-accent"
              >
                <span>Extend trial by 7 days</span>
                <Calendar className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleExtendTrial(selectedUser.id, 30)}
                className="flex w-full items-center justify-between rounded-lg border px-4 py-2.5 text-sm hover:bg-accent"
              >
                <span>Extend trial by 30 days</span>
                <Calendar className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleExtendTrial(selectedUser.id, 90)}
                className="flex w-full items-center justify-between rounded-lg border px-4 py-2.5 text-sm hover:bg-accent"
              >
                <span>Extend trial by 90 days</span>
                <Calendar className="h-4 w-4" />
              </button>
            </div>

            <button
              onClick={() => setSelectedUser(null)}
              className="mt-4 w-full rounded-lg bg-muted px-4 py-2 text-sm font-medium"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
