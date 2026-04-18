import { useState, useEffect } from 'react'
import { Search, ShieldAlert } from 'lucide-react'
import { searchUsers, changeUserRole, type AdminUser } from '@/services/adminService'

const ROLES = [
  { value: 'user',        label: 'User',        color: 'bg-muted' },
  { value: 'support',     label: 'Support',     color: 'bg-blue-500/15 text-blue-600' },
  { value: 'admin',       label: 'Admin',       color: 'bg-orange-500/15 text-orange-600' },
  { value: 'super_admin', label: 'Super Admin', color: 'bg-red-500/15 text-red-600' },
]

export default function AdminRoles() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUsers('')
  }, [])

  const loadUsers = async (q: string) => {
    setLoading(true)
    const result = await searchUsers(q, 100)
    setUsers(result)
    setLoading(false)
  }

  const handleChangeRole = async (userId: string, newRole: string, email: string) => {
    if (!confirm(`Change ${email} role to ${newRole}?`)) return
    const ok = await changeUserRole(userId, newRole)
    if (ok) {
      alert('Role updated')
      loadUsers(query)
    } else {
      alert('Failed to update role')
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Roles Management</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Assign admin roles to users (super_admin only)
        </p>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
        <ShieldAlert className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-destructive">Critical Security Action</p>
          <p className="mt-1 text-xs text-muted-foreground">
            All role changes are logged. Only assign admin roles to trusted team members.
            Super_admin can change any role; admin can change only user/support.
          </p>
        </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); loadUsers(query) }} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by email..."
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
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">Email</th>
                <th className="px-4 py-2 font-medium">Current Role</th>
                <th className="px-4 py-2 font-medium">Change To</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t hover:bg-accent/30">
                  <td className="px-4 py-3">
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded px-2 py-0.5 text-xs ${ROLES.find(r => r.value === u.role)?.color || 'bg-muted'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={u.role}
                      onChange={(e) => {
                        if (e.target.value !== u.role) {
                          handleChangeRole(u.id, e.target.value, u.email)
                        }
                      }}
                      className="rounded border bg-background px-2 py-1 text-xs"
                    >
                      {ROLES.map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
