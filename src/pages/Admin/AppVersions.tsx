import { useEffect, useState } from 'react'
import { AlertTriangle, Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface AppVersion {
  id: string
  platform: string
  latest_version: string
  min_version: string
  changelog_zh?: string
  changelog_en?: string
  download_url?: string
  is_active: boolean
  released_at: string
}

export default function AdminAppVersions() {
  const [versions, setVersions] = useState<AppVersion[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newVersion, setNewVersion] = useState({
    platform: 'android',
    latest_version: '',
    min_version: '',
    changelog_zh: '',
    changelog_en: '',
    download_url: '',
  })

  const loadVersions = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('app_versions')
      .select('*')
      .order('released_at', { ascending: false })
    setVersions((data as AppVersion[]) || [])
    setLoading(false)
  }

  useEffect(() => {
    loadVersions()
  }, [])

  const handleRelease = async () => {
    if (!newVersion.latest_version || !newVersion.min_version) {
      alert('Version numbers required')
      return
    }

    // Deactivate old version on same platform
    await supabase
      .from('app_versions')
      .update({ is_active: false })
      .eq('platform', newVersion.platform)
      .eq('is_active', true)

    // Insert new active version
    const { error } = await supabase.from('app_versions').insert({
      ...newVersion,
      is_active: true,
    })

    if (error) {
      alert('Failed: ' + error.message)
      return
    }

    // Log admin action
    await supabase.rpc('log_admin_action', {
      p_action: 'version.release',
      p_target_type: 'version',
      p_target_id: `${newVersion.platform}-${newVersion.latest_version}`,
      p_new_value: newVersion,
    })

    setShowAddForm(false)
    setNewVersion({ platform: 'android', latest_version: '', min_version: '', changelog_zh: '', changelog_en: '', download_url: '' })
    loadVersions()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">App Versions</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage APK / iOS / Web versions</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
        >
          <Plus className="h-4 w-4" />
          Release New
        </button>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/5 p-4">
        <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-warning">Forced Update Warning</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Setting <code>min_version</code> above a user's current version will force them to update
            before using the app. Use carefully.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">Platform</th>
                <th className="px-4 py-2 font-medium">Latest</th>
                <th className="px-4 py-2 font-medium">Min</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Released</th>
              </tr>
            </thead>
            <tbody>
              {versions.map((v) => (
                <tr key={v.id} className="border-t hover:bg-accent/30">
                  <td className="px-4 py-3 font-medium capitalize">{v.platform}</td>
                  <td className="px-4 py-3 font-mono text-xs">{v.latest_version}</td>
                  <td className="px-4 py-3 font-mono text-xs">{v.min_version}</td>
                  <td className="px-4 py-3">
                    {v.is_active ? (
                      <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-xs text-green-600">Active</span>
                    ) : (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs">Inactive</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(v.released_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowAddForm(false)}>
          <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">Release New Version</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium">Platform</label>
                <select
                  value={newVersion.platform}
                  onChange={(e) => setNewVersion({ ...newVersion, platform: e.target.value })}
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
                >
                  <option value="android">Android</option>
                  <option value="ios">iOS</option>
                  <option value="web">Web</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium">Latest Version</label>
                <input
                  value={newVersion.latest_version}
                  onChange={(e) => setNewVersion({ ...newVersion, latest_version: e.target.value })}
                  placeholder="1.2.0"
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium">Min Version (force update below)</label>
                <input
                  value={newVersion.min_version}
                  onChange={(e) => setNewVersion({ ...newVersion, min_version: e.target.value })}
                  placeholder="1.0.0"
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium">Download URL</label>
                <input
                  value={newVersion.download_url}
                  onChange={(e) => setNewVersion({ ...newVersion, download_url: e.target.value })}
                  placeholder="https://play.google.com/..."
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium">Changelog (中文)</label>
                <textarea
                  value={newVersion.changelog_zh}
                  onChange={(e) => setNewVersion({ ...newVersion, changelog_zh: e.target.value })}
                  rows={2}
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium">Changelog (English)</label>
                <textarea
                  value={newVersion.changelog_en}
                  onChange={(e) => setNewVersion({ ...newVersion, changelog_en: e.target.value })}
                  rows={2}
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="mt-5 flex gap-2">
              <button onClick={() => setShowAddForm(false)} className="flex-1 rounded-lg border py-2 text-sm">Cancel</button>
              <button onClick={handleRelease} className="flex-1 rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground">Release</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
