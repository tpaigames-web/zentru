import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Gift, Trophy, Clock } from 'lucide-react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { useUserStore } from '@/stores/useUserStore'

interface ContribStats {
  samples_submitted: number
  samples_approved: number
  total_days_earned: number
  last_submission_at: string | null
}

export default function ContributionsPage() {
  const { i18n } = useTranslation()
  const navigate = useNavigate()
  const { user, trialDaysLeft } = useUserStore()
  const [stats, setStats] = useState<ContribStats | null>(null)
  const [loading, setLoading] = useState(true)

  const isZh = i18n.language.startsWith('zh')

  useEffect(() => {
    if (!user || !isSupabaseConfigured) {
      setLoading(false)
      return
    }

    supabase
      .from('user_sample_stats')
      .select('*')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => {
        setStats(data as ContribStats | null)
        setLoading(false)
      })
  }, [user])

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/settings')} className="rounded-full p-1 hover:bg-accent">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h2 className="text-xl md:text-2xl font-bold">
          {isZh ? '我的贡献' : 'My Contributions'}
        </h2>
      </div>

      {!user ? (
        <div className="rounded-xl border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">
            {isZh ? '请先登录查看贡献记录' : 'Please sign in to view contributions'}
          </p>
        </div>
      ) : loading ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <>
          {/* Hero stats */}
          <div className="rounded-2xl border bg-gradient-to-br from-primary/10 to-primary/5 p-6 text-center">
            <Trophy className="mx-auto h-10 w-10 text-primary mb-3" />
            <p className="text-4xl font-bold">{stats?.total_days_earned || 0}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {isZh ? '累计延长免费试用（天）' : 'Total days earned'}
            </p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border bg-card p-4">
              <div className="flex items-center gap-2 mb-1">
                <Gift className="h-4 w-4 text-primary" />
                <p className="text-xs text-muted-foreground">
                  {isZh ? '已贡献样本' : 'Samples'}
                </p>
              </div>
              <p className="text-2xl font-bold">{stats?.samples_submitted || 0}</p>
            </div>
            <div className="rounded-xl border bg-card p-4">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-primary" />
                <p className="text-xs text-muted-foreground">
                  {isZh ? '当前剩余' : 'Days left'}
                </p>
              </div>
              <p className="text-2xl font-bold">{trialDaysLeft}</p>
            </div>
          </div>

          {/* How it works */}
          <div className="rounded-xl border bg-card p-5">
            <h3 className="text-sm font-semibold mb-3">
              {isZh ? '如何获得延长' : 'How to earn extension'}
            </h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  +7
                </div>
                <div>
                  <p className="font-medium">{isZh ? '普通样本' : 'Regular sample'}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isZh ? '成功导入已支持银行的账单' : 'Successfully parsed supported bank statement'}
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-warning/15 text-xs font-bold text-warning">
                  +30
                </div>
                <div>
                  <p className="font-medium">{isZh ? '新银行格式' : 'New bank format'}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isZh ? '解析失败的 PDF，帮我们扩展支持' : 'Failed parse — helps us add new bank support'}
                  </p>
                </div>
              </li>
            </ul>
            <div className="mt-4 rounded-lg bg-muted/30 p-3 text-xs text-muted-foreground leading-relaxed">
              {isZh
                ? '📌 同一银行 24 小时内只计一次。所有样本都经过脱敏处理，不包含任何个人信息。'
                : '📌 Only one sample per bank per 24 hours. All samples are anonymized.'}
            </div>
          </div>

          <button
            onClick={() => navigate('/import')}
            className="w-full rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground"
          >
            {isZh ? '前往导入账单' : 'Go to Import'}
          </button>
        </>
      )}
    </div>
  )
}
