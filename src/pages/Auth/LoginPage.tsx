import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CreditCard, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useUserStore } from '@/stores/useUserStore'

export default function LoginPage() {
  const { t, i18n } = useTranslation()
  const { signIn, signUp, signInWithGoogle } = useUserStore()
  const isZh = i18n.language.startsWith('zh')

  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return

    setLoading(true)
    setError('')
    setSuccess('')

    if (isRegister) {
      if (password.length < 6) {
        setError(isZh ? '密码至少 6 位' : 'Password must be at least 6 characters')
        setLoading(false)
        return
      }
      const result = await signUp(email, password)
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(isZh ? '注册成功！请查看邮箱确认链接。' : 'Registration successful! Check your email for confirmation.')
      }
    } else {
      const result = await signIn(email, password)
      if (result.error) {
        setError(result.error)
      }
    }

    setLoading(false)
  }

  const handleGoogle = async () => {
    setLoading(true)
    setError('')
    const result = await signInWithGoogle()
    if (result.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      {/* Logo */}
      <div className="mb-8 flex flex-col items-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
          <CreditCard className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold">Zentru</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('app.tagline')}</p>
      </div>

      {/* Form */}
      <div className="w-full max-w-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={isZh ? '邮箱地址' : 'Email address'}
              className="w-full rounded-xl border bg-card pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/50"
              required
            />
          </div>

          {/* Password */}
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isZh ? '密码' : 'Password'}
              className="w-full rounded-xl border bg-card pl-10 pr-10 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/50"
              required
              minLength={6}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>
          )}

          {success && (
            <p className="rounded-lg bg-success/10 px-3 py-2 text-xs text-success">{success}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {isRegister
              ? (isZh ? '注册' : 'Sign Up')
              : (isZh ? '登录' : 'Sign In')
            }
          </button>
        </form>

        {/* Divider */}
        <div className="my-5 flex items-center gap-3">
          <div className="flex-1 border-t" />
          <span className="text-xs text-muted-foreground">{isZh ? '或' : 'or'}</span>
          <div className="flex-1 border-t" />
        </div>

        {/* Google */}
        <button
          onClick={handleGoogle}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl border bg-card py-3 text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          {isZh ? '使用 Google 登录' : 'Continue with Google'}
        </button>

        {/* Toggle */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          {isRegister
            ? (isZh ? '已有账号？' : 'Already have an account? ')
            : (isZh ? '还没有账号？' : "Don't have an account? ")
          }
          <button
            onClick={() => { setIsRegister(!isRegister); setError(''); setSuccess('') }}
            className="font-medium text-primary hover:underline"
          >
            {isRegister ? (isZh ? '登录' : 'Sign In') : (isZh ? '注册' : 'Sign Up')}
          </button>
        </p>

        {/* Skip login (use locally) */}
        <p className="mt-4 text-center">
          <button
            onClick={() => {
              localStorage.setItem('zentru-skip-auth', '1')
              window.location.reload()
            }}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {isZh ? '跳过登录，仅本地使用' : 'Skip login, use locally only'}
          </button>
        </p>
      </div>
    </div>
  )
}
