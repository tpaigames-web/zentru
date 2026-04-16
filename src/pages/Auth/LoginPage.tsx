import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { CreditCard, Mail, Lock, Eye, EyeOff, Loader2, ShieldCheck, UserPlus } from 'lucide-react'
import { useUserStore } from '@/stores/useUserStore'

type PasswordStrength = 'weak' | 'medium' | 'strong'

function getPasswordStrength(password: string): PasswordStrength {
  if (password.length < 6) return 'weak'
  const hasLetter = /[a-zA-Z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSpecial = /[^a-zA-Z0-9]/.test(password)
  if (password.length >= 8 && hasLetter && (hasNumber || hasSpecial)) return 'strong'
  if (hasLetter && hasNumber) return 'medium'
  return 'medium'
}

export default function LoginPage() {
  const { i18n } = useTranslation()
  const { signIn, signUp } = useUserStore()
  const isZh = i18n.language.startsWith('zh')

  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const passwordStrength = useMemo(() => getPasswordStrength(password), [password])

  const strengthLabel = {
    weak: isZh ? '弱' : 'Weak',
    medium: isZh ? '中' : 'Medium',
    strong: isZh ? '强' : 'Strong',
  }

  const strengthColor = {
    weak: 'bg-red-500',
    medium: 'bg-yellow-500',
    strong: 'bg-green-500',
  }

  const strengthTextColor = {
    weak: 'text-red-500',
    medium: 'text-yellow-500',
    strong: 'text-green-500',
  }

  const strengthWidth = {
    weak: 'w-1/3',
    medium: 'w-2/3',
    strong: 'w-full',
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return

    setLoading(true)
    setError('')
    setSuccess('')

    if (isRegister) {
      // Validate password strength
      if (passwordStrength === 'weak') {
        setError(isZh ? '密码太弱，至少需要 6 位字符' : 'Password is too weak, at least 6 characters required')
        setLoading(false)
        return
      }
      // Validate confirm password
      if (password !== confirmPassword) {
        setError(isZh ? '两次输入的密码不一致' : 'Passwords do not match')
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

  const switchMode = () => {
    setIsRegister(!isRegister)
    setError('')
    setSuccess('')
    setConfirmPassword('')
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      {/* Logo */}
      <div className="mb-6 flex flex-col items-center">
        <div className={`mb-4 flex h-16 w-16 items-center justify-center rounded-2xl ${isRegister ? 'bg-green-600' : 'bg-primary'} transition-colors duration-300`}>
          {isRegister
            ? <UserPlus className="h-8 w-8 text-white" />
            : <CreditCard className="h-8 w-8 text-white" />
          }
        </div>
        <h1 className="text-2xl font-bold">
          {isRegister
            ? (isZh ? '创建账号' : 'Create Account')
            : (isZh ? '欢迎回来' : 'Welcome Back')
          }
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isRegister
            ? (isZh ? '开始使用 Zentru 管理消费' : 'Start using Zentru to track expenses')
            : (isZh ? '登录你的 Zentru 账号' : 'Sign in to your Zentru account')
          }
        </p>
      </div>

      {/* Form */}
      <div className="w-full max-w-sm">
        <form onSubmit={handleSubmit} className="space-y-3.5">
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

          {/* Password strength indicator (register only) */}
          {isRegister && password.length > 0 && (
            <div className="space-y-1.5 px-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {isZh ? '密码强度' : 'Password strength'}
                </span>
                <span className={`text-xs font-medium ${strengthTextColor[passwordStrength]}`}>
                  {strengthLabel[passwordStrength]}
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-300 ${strengthColor[passwordStrength]} ${strengthWidth[passwordStrength]}`} />
              </div>
              <p className="text-[11px] text-muted-foreground">
                {isZh ? '建议：至少 8 位，包含字母和数字' : 'Tip: At least 8 chars with letters and numbers'}
              </p>
            </div>
          )}

          {/* Confirm Password (register only) */}
          {isRegister && (
            <div className="relative">
              <ShieldCheck className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={isZh ? '确认密码' : 'Confirm password'}
                className={`w-full rounded-xl border bg-card pl-10 pr-10 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/50 ${
                  confirmPassword && password !== confirmPassword ? 'border-red-500 focus:ring-red-500/50' : ''
                }`}
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          )}

          {/* Password mismatch hint */}
          {isRegister && confirmPassword && password !== confirmPassword && (
            <p className="px-1 text-xs text-red-500">
              {isZh ? '两次输入的密码不一致' : 'Passwords do not match'}
            </p>
          )}

          {error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>
          )}

          {success && (
            <p className="rounded-lg bg-green-500/10 px-3 py-2 text-xs text-green-500">{success}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || (isRegister && passwordStrength === 'weak' && password.length > 0)}
            className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-colors disabled:opacity-50 ${
              isRegister
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-primary hover:bg-primary/90'
            }`}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {isRegister
              ? (isZh ? '创建账号' : 'Create Account')
              : (isZh ? '登录' : 'Sign In')
            }
          </button>
        </form>

        {/* Toggle */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          {isRegister
            ? (isZh ? '已有账号？' : 'Already have an account? ')
            : (isZh ? '还没有账号？' : "Don't have an account? ")
          }
          <button
            onClick={switchMode}
            className="font-medium text-primary hover:underline"
          >
            {isRegister ? (isZh ? '登录' : 'Sign In') : (isZh ? '免费注册' : 'Sign Up Free')}
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
