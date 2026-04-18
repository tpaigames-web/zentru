import { useEffect, useState } from 'react'
import { AlertTriangle, Check, X } from 'lucide-react'
import { useModulesStore } from '@/stores/useModulesStore'
import { toggleModule, updateModulePlan } from '@/services/adminService'

export default function AdminModules() {
  const { modules, loadModules } = useModulesStore()
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    loadModules()
  }, [loadModules])

  const handleToggle = async (moduleKey: string, currentEnabled: boolean) => {
    if (!confirm(`${currentEnabled ? 'Disable' : 'Enable'} module "${moduleKey}" for all users?`)) return
    setSaving(moduleKey)
    await toggleModule(moduleKey, !currentEnabled)
    await loadModules()
    setSaving(null)
  }

  const handlePlanChange = async (moduleKey: string, newPlan: 'free' | 'premium') => {
    setSaving(moduleKey)
    await updateModulePlan(moduleKey, newPlan)
    await loadModules()
    setSaving(null)
  }

  const highRiskKeys = ['budget', 'predictions', 'smart_card', 'analytics_investment', 'analytics_tax']

  // Group by category
  const byCategory = modules.reduce<Record<string, typeof modules>>((acc, m) => {
    if (!acc[m.category]) acc[m.category] = []
    acc[m.category].push(m)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Modules</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Control which features are available to users globally
        </p>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/5 p-4">
        <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-warning">Compliance Warning</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Modules marked with red are high-risk (could be misinterpreted as financial advice).
            Keep them OFF unless you have proper disclaimers.
          </p>
        </div>
      </div>

      {Object.entries(byCategory).map(([category, catModules]) => (
        <div key={category} className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="border-b bg-muted/30 px-4 py-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {category}
            </p>
          </div>

          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted-foreground border-b">
              <tr>
                <th className="px-4 py-2 font-medium">Module</th>
                <th className="px-4 py-2 font-medium">Plan</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Toggle</th>
              </tr>
            </thead>
            <tbody>
              {catModules.map((m) => {
                const isRisk = highRiskKeys.includes(m.key)
                return (
                  <tr key={m.key} className="border-t hover:bg-accent/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{m.name_en}</p>
                        {isRisk && (
                          <span className="rounded bg-red-500/15 px-1.5 py-0.5 text-[10px] font-medium text-red-600">
                            ⚠ HIGH RISK
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground font-mono">{m.key}</p>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={m.min_plan}
                        onChange={(e) => handlePlanChange(m.key, e.target.value as 'free' | 'premium')}
                        disabled={saving === m.key}
                        className="rounded border bg-background px-2 py-1 text-xs"
                      >
                        <option value="free">Free</option>
                        <option value="premium">Premium</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      {m.enabled ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-500/15 px-2 py-0.5 text-xs text-green-600">
                          <Check className="h-3 w-3" /> Enabled
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          <X className="h-3 w-3" /> Disabled
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggle(m.key, m.enabled)}
                        disabled={saving === m.key}
                        className={`relative h-6 w-11 rounded-full transition-colors ${
                          m.enabled ? 'bg-primary' : 'bg-muted'
                        } disabled:opacity-50`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                            m.enabled ? 'translate-x-5' : ''
                          }`}
                        />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  )
}
