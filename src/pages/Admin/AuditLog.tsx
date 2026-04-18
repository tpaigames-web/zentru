import { useEffect, useState } from 'react'
import { Activity } from 'lucide-react'
import { getAuditLog, type AuditLogEntry } from '@/services/adminService'

export default function AdminAuditLog() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAuditLog(200).then((data) => {
      setLogs(data)
      setLoading(false)
    })
  }, [])

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Audit Log</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          All admin actions recorded (last 200)
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : logs.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center">
          <Activity className="mx-auto h-8 w-8 text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground">No admin actions yet</p>
        </div>
      ) : (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 font-medium">Time</th>
                  <th className="px-4 py-2 font-medium">Admin</th>
                  <th className="px-4 py-2 font-medium">Action</th>
                  <th className="px-4 py-2 font-medium">Target</th>
                  <th className="px-4 py-2 font-medium">Changes</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-t hover:bg-accent/30">
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-xs">{log.admin_email}</td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-mono text-primary">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span className="text-muted-foreground">{log.target_type}:</span>{' '}
                      <span className="font-mono">{log.target_id?.slice(0, 12)}</span>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {log.new_value ? (
                        <code className="rounded bg-muted px-1.5 py-0.5">
                          {JSON.stringify(log.new_value).slice(0, 60)}
                        </code>
                      ) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
