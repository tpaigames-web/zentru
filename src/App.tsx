import { useEffect, useState, lazy, Suspense, type ComponentType } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router'
import { DataProvider } from '@/data/DataProvider'
import { seedDefaultCategories } from '@/data/seed'
import { AppLayout } from '@/components/layout/AppLayout'
import { ModuleGuard } from '@/components/ModuleGuard'
import { AdminGuard } from '@/components/AdminGuard'
import { UpdateModal } from '@/components/shared/UpdateModal'
import { UpdateBanner } from '@/components/shared/UpdateBanner'
import { checkForUpdate, type VersionCheckResult } from '@/services/versionCheck'
import { useAuthStore } from '@/stores/useAuthStore'
import { useUserStore } from '@/stores/useUserStore'
import { useModulesStore } from '@/stores/useModulesStore'

// Lazy load all pages — each becomes a separate chunk
/**
 * Safe lazy wrapper: retries failed chunks without forcing reload.
 *
 * Old behavior (removed): auto-cleared caches + reloaded → interrupted users.
 * New behavior: retry once with cache-busting query string. If that fails,
 * throw so the ErrorBoundary shows a "Clear Cache & Reload" prompt the
 * USER controls, preserving their in-progress work.
 */
function safeLazy<T extends ComponentType<any>>(loader: () => Promise<{ default: T }>) {
  return lazy(async () => {
    try {
      return await loader()
    } catch (err) {
      console.warn('Lazy chunk failed, retrying:', err)
      // Wait a moment then retry once — often resolves transient network hiccups
      await new Promise((r) => setTimeout(r, 500))
      try {
        return await loader()
      } catch (err2) {
        console.error('Lazy chunk failed after retry:', err2)
        throw err2
      }
    }
  })
}

const LoginPage = safeLazy(() => import('@/pages/Auth/LoginPage'))
const Onboarding = safeLazy(() => import('@/pages/Onboarding').then(m => ({ default: m.Onboarding })))
const LockScreen = safeLazy(() => import('@/components/LockScreen').then(m => ({ default: m.LockScreen })))
const DashboardPage = safeLazy(() => import('@/pages/Dashboard'))
const CardsPage = safeLazy(() => import('@/pages/Cards'))
const CardDetailPage = safeLazy(() => import('@/pages/Cards/CardDetail'))
const TransactionsPage = safeLazy(() => import('@/pages/Transactions'))
const NewTransactionPage = safeLazy(() => import('@/pages/Transactions/NewTransaction'))
const QuickAddPage = safeLazy(() => import('@/pages/Transactions/QuickAdd'))
const TransferPage = safeLazy(() => import('@/pages/Transactions/Transfer'))
const AnalyticsPage = safeLazy(() => import('@/pages/Analytics'))
const PredictionsPage = safeLazy(() => import('@/pages/Predictions'))
const BudgetPage = safeLazy(() => import('@/pages/Budget'))
const CashbackPage = safeLazy(() => import('@/pages/Cashback'))
const SmartCardPage = safeLazy(() => import('@/pages/SmartCard'))
const RecurringPage = safeLazy(() => import('@/pages/Recurring'))
const CategoriesPage = safeLazy(() => import('@/pages/Categories'))
const PaymentMethodsPage = safeLazy(() => import('@/pages/PaymentMethods'))
const ImportPage = safeLazy(() => import('@/pages/Import'))
const SettingsPage = safeLazy(() => import('@/pages/Settings'))
const AboutPage = safeLazy(() => import('@/pages/Settings/About'))
const PrivacyPolicyPage = safeLazy(() => import('@/pages/Settings/PrivacyPolicy'))
const UICustomizePage = safeLazy(() => import('@/pages/Settings/UICustomize'))
const ContributionsPage = safeLazy(() => import('@/pages/Settings/Contributions'))

// Admin pages (lazy loaded)
const AdminLayout = safeLazy(() => import('@/pages/Admin/AdminLayout').then(m => ({ default: m.AdminLayout })))
const AdminDashboard = safeLazy(() => import('@/pages/Admin/Dashboard'))
const AdminUsers = safeLazy(() => import('@/pages/Admin/Users'))
const AdminModules = safeLazy(() => import('@/pages/Admin/Modules'))
const AdminRoles = safeLazy(() => import('@/pages/Admin/Roles'))
const AdminAuditLog = safeLazy(() => import('@/pages/Admin/AuditLog'))
const AdminAppVersions = safeLazy(() => import('@/pages/Admin/AppVersions'))
const AdminPlaceholderComponent = safeLazy(() => import('@/pages/Admin/Placeholder').then(m => ({ default: () => {
  const path = window.location.pathname
  const titles: Record<string, string> = {
    '/internal/ops/samples': 'Sample Review',
    '/internal/ops/versions': 'App Versions',
    '/internal/ops/broadcasts': 'Broadcasts',
    '/internal/ops/api-keys': 'API Keys',
    '/internal/ops/revenue': 'Revenue',
  }
  return m.AdminPlaceholder({ title: titles[path] || 'Coming Soon' })
} })))
const LandingPage = safeLazy(() => import('@/pages/Landing'))
const NotFoundPage = safeLazy(() => import('@/pages/NotFound'))

function PageLoader() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
      <div style={{ width: '32px', height: '32px', border: '3px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

const ONBOARDING_KEY = 'zentru-onboarded'

export default function App() {
  const [ready, setReady] = useState(false)
  const [initError] = useState<string | null>(null)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [updateCheck, setUpdateCheck] = useState<VersionCheckResult | null>(null)
  const [updateDismissed, setUpdateDismissed] = useState(false)
  const { user, loading: authLoading, initialize } = useUserStore()

  // Prevent back button from closing the app (Android/PWA)
  useEffect(() => {
    // Push an initial state so there's always history to go back to
    window.history.pushState(null, '', window.location.href)

    const handlePopState = () => {
      // Re-push state to prevent exiting
      window.history.pushState(null, '', window.location.href)
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  // Version check on startup (non-blocking)
  useEffect(() => {
    checkForUpdate().then((result) => {
      if (result.action !== 'none') {
        setUpdateCheck(result)
      }
    }).catch(() => {})
  }, [])

  useEffect(() => {
    // Wrap each task with individual timeout so slow network doesn't block boot
    const withTimeout = <T,>(promise: Promise<T>, ms: number, label: string): Promise<T | null> => {
      return Promise.race([
        promise.catch((e) => { console.warn(`${label} failed:`, e); return null }),
        new Promise<null>((resolve) => setTimeout(() => {
          console.warn(`${label} timed out after ${ms}ms — continuing anyway`)
          resolve(null)
        }, ms)),
      ])
    }

    // Run all init tasks in parallel with 5s timeout each
    // App will always become ready within 5s even if network is dead
    Promise.all([
      withTimeout(seedDefaultCategories(), 5000, 'Seed'),
      withTimeout(initialize(), 5000, 'Auth init'),
      withTimeout(useModulesStore.getState().loadModules(), 5000, 'Modules'),
    ]).then(() => {
      const onboarded = localStorage.getItem(ONBOARDING_KEY)
      if (!onboarded) setShowOnboarding(true)
      setReady(true)
    })

    // Hard fallback: force ready after 6s no matter what
    // Also force user-store loading to false if it's still stuck
    // (e.g. Supabase getSession hung with no network)
    const hardTimeout = setTimeout(() => {
      setReady((current) => current || true)
      const userStore = useUserStore.getState()
      if (userStore.loading) {
        console.warn('Auth still loading after 6s — forcing unblock')
        useUserStore.setState({ loading: false })
      }
    }, 6000)

    return () => clearTimeout(hardTimeout)
  }, [])

  const handleOnboardingComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, '1')
    setShowOnboarding(false)
  }

  if (initError) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: '#fff', fontFamily: 'sans-serif' }}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>App initialization failed</p>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{initError}</p>
          <button onClick={() => window.location.reload()} style={{ marginTop: '1.5rem', padding: '0.5rem 1.5rem', background: '#3b82f6', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer' }}>
            Reload
          </button>
        </div>
      </div>
    )
  }

  if (!ready || authLoading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: '#fff', fontFamily: 'sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '4px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
          <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Loading...</p>
          <button
            onClick={async () => {
              try {
                if ('serviceWorker' in navigator) {
                  const regs = await navigator.serviceWorker.getRegistrations()
                  await Promise.all(regs.map((r) => r.unregister()))
                }
                if ('caches' in window) {
                  const keys = await caches.keys()
                  await Promise.all(keys.map((k) => caches.delete(k)))
                }
              } catch {}
              window.location.reload()
            }}
            style={{ marginTop: '1.25rem', padding: '0.4rem 1rem', background: 'transparent', border: '1px solid #334155', borderRadius: '6px', color: '#94a3b8', fontSize: '0.75rem', cursor: 'pointer' }}
          >
            Stuck? Clear cache & reload
          </button>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      </div>
    )
  }

  // Show login first (before onboarding)
  const skipAuth = localStorage.getItem('zentru-skip-auth') === '1'
  if (!user && !skipAuth) {
    return (
      <Suspense fallback={<PageLoader />}>
        <LoginPage />
      </Suspense>
    )
  }

  if (showOnboarding) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Onboarding onComplete={handleOnboardingComplete} />
      </Suspense>
    )
  }

  if (useAuthStore.getState().isLocked) {
    return (
      <Suspense fallback={<PageLoader />}>
        <LockScreen />
      </Suspense>
    )
  }

  // Forced update blocks everything else
  if (updateCheck?.action === 'forced') {
    return <UpdateModal result={updateCheck} />
  }

  return (
    <DataProvider>
      {/* Non-blocking SW update banner — user decides when to reload */}
      <UpdateBanner />
      {/* Optional APK update banner (dismissible) */}
      {updateCheck?.action === 'optional' && !updateDismissed && (
        <UpdateModal result={updateCheck} onDismiss={() => setUpdateDismissed(true)} />
      )}
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="landing" element={<LandingPage />} />

            {/* Admin panel — requires admin role */}
            <Route path="internal/ops" element={<AdminGuard required="support"><AdminLayout /></AdminGuard>}>
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="modules" element={<AdminGuard required="admin"><AdminModules /></AdminGuard>} />
              <Route path="samples" element={<AdminPlaceholderComponent />} />
              <Route path="versions" element={<AdminGuard required="super_admin"><AdminAppVersions /></AdminGuard>} />
              <Route path="broadcasts" element={<AdminPlaceholderComponent />} />
              <Route path="audit" element={<AdminGuard required="super_admin"><AdminAuditLog /></AdminGuard>} />
              <Route path="roles" element={<AdminGuard required="super_admin"><AdminRoles /></AdminGuard>} />
              <Route path="api-keys" element={<AdminGuard required="super_admin"><AdminPlaceholderComponent /></AdminGuard>} />
              <Route path="revenue" element={<AdminPlaceholderComponent />} />
            </Route>

            <Route element={<AppLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="cards" element={<CardsPage />} />
              <Route path="cards/:id" element={<CardDetailPage />} />
              <Route path="transactions" element={<TransactionsPage />} />
              <Route path="transactions/new" element={<QuickAddPage />} />
              <Route path="transactions/new/detailed" element={<NewTransactionPage />} />
              <Route path="transactions/transfer" element={<TransferPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              {/* High-risk modules: guarded */}
              <Route path="predictions" element={<ModuleGuard module="predictions"><PredictionsPage /></ModuleGuard>} />
              <Route path="budget" element={<ModuleGuard module="budget"><BudgetPage /></ModuleGuard>} />
              <Route path="smart" element={<ModuleGuard module="smart_card"><SmartCardPage /></ModuleGuard>} />
              <Route path="cashback" element={<ModuleGuard module="cashback_tracking"><CashbackPage /></ModuleGuard>} />
              <Route path="recurring" element={<ModuleGuard module="recurring"><RecurringPage /></ModuleGuard>} />
              <Route path="categories" element={<CategoriesPage />} />
              <Route path="payment-methods" element={<PaymentMethodsPage />} />
              <Route path="import" element={<ImportPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="settings/ui-customize" element={<UICustomizePage />} />
              <Route path="settings/contributions" element={<ContributionsPage />} />
              <Route path="about" element={<AboutPage />} />
              <Route path="privacy" element={<PrivacyPolicyPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </DataProvider>
  )
}
