import { useEffect, useState, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router'
import { DataProvider } from '@/data/DataProvider'
import { seedDefaultCategories } from '@/data/seed'
import { AppLayout } from '@/components/layout/AppLayout'
import { ModuleGuard } from '@/components/ModuleGuard'
import { AdminGuard } from '@/components/AdminGuard'
import { useAuthStore } from '@/stores/useAuthStore'
import { useUserStore } from '@/stores/useUserStore'
import { useModulesStore } from '@/stores/useModulesStore'

// Lazy load all pages — each becomes a separate chunk
const LoginPage = lazy(() => import('@/pages/Auth/LoginPage'))
const Onboarding = lazy(() => import('@/pages/Onboarding').then(m => ({ default: m.Onboarding })))
const LockScreen = lazy(() => import('@/components/LockScreen').then(m => ({ default: m.LockScreen })))
const DashboardPage = lazy(() => import('@/pages/Dashboard'))
const CardsPage = lazy(() => import('@/pages/Cards'))
const CardDetailPage = lazy(() => import('@/pages/Cards/CardDetail'))
const TransactionsPage = lazy(() => import('@/pages/Transactions'))
const NewTransactionPage = lazy(() => import('@/pages/Transactions/NewTransaction'))
const AnalyticsPage = lazy(() => import('@/pages/Analytics'))
const PredictionsPage = lazy(() => import('@/pages/Predictions'))
const BudgetPage = lazy(() => import('@/pages/Budget'))
const CashbackPage = lazy(() => import('@/pages/Cashback'))
const SmartCardPage = lazy(() => import('@/pages/SmartCard'))
const RecurringPage = lazy(() => import('@/pages/Recurring'))
const CategoriesPage = lazy(() => import('@/pages/Categories'))
const PaymentMethodsPage = lazy(() => import('@/pages/PaymentMethods'))
const ImportPage = lazy(() => import('@/pages/Import'))
const SettingsPage = lazy(() => import('@/pages/Settings'))
const AboutPage = lazy(() => import('@/pages/Settings/About'))
const PrivacyPolicyPage = lazy(() => import('@/pages/Settings/PrivacyPolicy'))
const UICustomizePage = lazy(() => import('@/pages/Settings/UICustomize'))

// Admin pages (lazy loaded)
const AdminLayout = lazy(() => import('@/pages/Admin/AdminLayout').then(m => ({ default: m.AdminLayout })))
const AdminDashboard = lazy(() => import('@/pages/Admin/Dashboard'))
const AdminUsers = lazy(() => import('@/pages/Admin/Users'))
const AdminModules = lazy(() => import('@/pages/Admin/Modules'))
const AdminRoles = lazy(() => import('@/pages/Admin/Roles'))
const AdminAuditLog = lazy(() => import('@/pages/Admin/AuditLog'))
const AdminPlaceholderComponent = lazy(() => import('@/pages/Admin/Placeholder').then(m => ({ default: () => {
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
const LandingPage = lazy(() => import('@/pages/Landing'))
const NotFoundPage = lazy(() => import('@/pages/NotFound'))

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
  const [initError, setInitError] = useState<string | null>(null)
  const [showOnboarding, setShowOnboarding] = useState(false)
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

  useEffect(() => {
    Promise.all([
      seedDefaultCategories().catch((e) => console.warn('Seed failed:', e)),
      initialize().catch((e) => console.warn('Auth init failed:', e)),
      useModulesStore.getState().loadModules().catch((e) => console.warn('Modules init failed:', e)),
    ]).then(() => {
      const onboarded = localStorage.getItem(ONBOARDING_KEY)
      if (!onboarded) setShowOnboarding(true)
      setReady(true)
    }).catch((e) => {
      console.error('App init failed:', e)
      setInitError(e?.message || 'Unknown error')
      setReady(true)
    })
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

  return (
    <DataProvider>
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
              <Route path="versions" element={<AdminGuard required="super_admin"><AdminPlaceholderComponent /></AdminGuard>} />
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
              <Route path="transactions/new" element={<NewTransactionPage />} />
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
