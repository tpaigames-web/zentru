import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Check, Layers, Settings2 } from 'lucide-react'
import { useUserStore } from '@/stores/useUserStore'
import { useModulesStore } from '@/stores/useModulesStore'
import { useModules } from '@/hooks/useModules'
import { cn } from '@/lib/utils'

export default function UICustomizePage() {
  const { i18n } = useTranslation()
  const navigate = useNavigate()
  const { user, isPremium } = useUserStore()
  const { presets, applyPreset, updatePref, loadModules, loadUserPrefs } = useModulesStore()
  const { modules, userPrefs } = useModules()
  const [mode, setMode] = useState<'preset' | 'custom'>('preset')
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')

  const isZh = i18n.language.startsWith('zh')

  useEffect(() => {
    loadModules()
    if (user?.id) loadUserPrefs(user.id)
  }, [user?.id, loadModules, loadUserPrefs])

  const handleApplyPreset = async (presetKey: string) => {
    if (!user?.id) return
    setSaving(true)
    await applyPreset(user.id, presetKey)
    setSavedMsg(isZh ? '✓ 已应用预设' : '✓ Preset applied')
    setSaving(false)
    setTimeout(() => setSavedMsg(''), 2000)
  }

  const handleToggleModule = async (moduleKey: string, currentVisible: boolean) => {
    if (!user?.id) return
    await updatePref(user.id, moduleKey, { visible: !currentVisible })
    setSavedMsg(isZh ? '✓ 已保存' : '✓ Saved')
    setTimeout(() => setSavedMsg(''), 1500)
  }

  const isVisible = (key: string) => {
    const pref = userPrefs.find((p) => p.module_key === key)
    const mod = modules.find((m) => m.key === key)
    return pref?.visible ?? mod?.default_visible ?? false
  }

  // Group modules by category
  const categories = ['core', 'cards', 'analytics', 'import', 'sync', 'advanced']
  const enabledModules = modules.filter((m) => m.enabled && !(m.min_plan === 'premium' && !isPremium))

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/settings')} className="rounded-full p-1 hover:bg-accent">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h2 className="text-xl md:text-2xl font-bold">{isZh ? '界面定制' : 'UI Customize'}</h2>
      </div>

      {savedMsg && (
        <div className="rounded-lg bg-green-500/10 px-4 py-2 text-sm text-green-600">{savedMsg}</div>
      )}

      {/* Mode switcher */}
      <div className="flex rounded-lg bg-muted p-1">
        <button
          onClick={() => setMode('preset')}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
            mode === 'preset' ? 'bg-background shadow-sm' : 'text-muted-foreground'
          )}
        >
          <Layers className="h-3.5 w-3.5" />
          {isZh ? '场景预设' : 'Presets'}
        </button>
        <button
          onClick={() => setMode('custom')}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
            mode === 'custom' ? 'bg-background shadow-sm' : 'text-muted-foreground'
          )}
        >
          <Settings2 className="h-3.5 w-3.5" />
          {isZh ? '自定义模块' : 'Custom Modules'}
        </button>
      </div>

      {/* Preset mode */}
      {mode === 'preset' && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground px-1">
            {isZh ? '选择一个场景快速套用，覆盖所有模块设置' : 'Pick a preset to quickly configure all modules'}
          </p>
          {presets.map((preset) => (
            <button
              key={preset.key}
              onClick={() => handleApplyPreset(preset.key)}
              disabled={saving}
              className="w-full rounded-xl border bg-card p-4 text-left hover:bg-accent/30 transition-colors disabled:opacity-50"
            >
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-semibold">{isZh ? preset.name_zh : preset.name_en}</p>
                <span className="text-xs text-primary">{isZh ? '应用' : 'Apply'} →</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {isZh ? preset.description_zh : preset.description_en}
              </p>
              <p className="mt-2 text-[11px] text-muted-foreground">
                {preset.modules.length === 0
                  ? (isZh ? '包含所有启用的模块' : 'Includes all enabled modules')
                  : `${preset.modules.length} ${isZh ? '个模块' : 'modules'}`}
              </p>
            </button>
          ))}
        </div>
      )}

      {/* Custom mode */}
      {mode === 'custom' && (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground px-1">
            {isZh ? '单独控制每个模块的显示' : 'Control visibility of each module'}
          </p>

          {categories.map((cat) => {
            const catModules = enabledModules.filter((m) => m.category === cat)
            if (catModules.length === 0) return null
            return (
              <div key={cat} className="rounded-xl border bg-card shadow-sm overflow-hidden">
                <div className="border-b bg-muted/30 px-4 py-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {cat}
                  </p>
                </div>
                {catModules.map((mod, i) => {
                  const visible = isVisible(mod.key)
                  return (
                    <div
                      key={mod.key}
                      className={cn(
                        'flex items-center justify-between px-4 py-3',
                        i > 0 && 'border-t'
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{isZh ? mod.name_zh : mod.name_en}</p>
                        {mod.description_zh && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {isZh ? mod.description_zh : mod.description_en}
                          </p>
                        )}
                        {mod.min_plan === 'premium' && (
                          <span className="mt-1 inline-block rounded bg-warning/20 px-1.5 py-0.5 text-[10px] font-medium text-warning">
                            Premium
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleToggleModule(mod.key, visible)}
                        className={cn(
                          'relative h-6 w-11 shrink-0 rounded-full transition-colors',
                          visible ? 'bg-primary' : 'bg-muted'
                        )}
                      >
                        <span
                          className={cn(
                            'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
                            visible ? 'translate-x-5' : ''
                          )}
                        />
                        {visible && (
                          <Check className="absolute top-1/2 left-1.5 h-3 w-3 -translate-y-1/2 text-primary-foreground" />
                        )}
                      </button>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
