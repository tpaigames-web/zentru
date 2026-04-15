import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router'
import { DataProvider } from '@/data/DataProvider'
import { seedDefaultCategories } from '@/data/seed'
import { AppLayout } from '@/components/layout/AppLayout'
import { Onboarding } from '@/pages/Onboarding'
import { LockScreen } from '@/components/LockScreen'
import { useAuthStore } from '@/stores/useAuthStore'
import { useUserStore } from '@/stores/useUserStore'
import DashboardPage from '@/pages/Dashboard'
import CardsPage from '@/pages/Cards'
import CardDetailPage from '@/pages/Cards/CardDetail'
import TransactionsPage from '@/pages/Transactions'
import NewTransactionPage from '@/pages/Transactions/NewTransaction'
import AnalyticsPage from '@/pages/Analytics'
import PredictionsPage from '@/pages/Predictions'
import BudgetPage from '@/pages/Budget'
import CashbackPage from '@/pages/Cashback'
import SmartCardPage from '@/pages/SmartCard'
import RecurringPage from '@/pages/Recurring'
import CategoriesPage from '@/pages/Categories'
import PaymentMethodsPage from '@/pages/PaymentMethods'
import ImportPage from '@/pages/Import'
import SettingsPage from '@/pages/Settings'
import AboutPage from '@/pages/Settings/About'
import PrivacyPolicyPage from '@/pages/Settings/PrivacyPolicy'
import LandingPage from '@/pages/Landing'
import NotFoundPage from '@/pages/NotFound'
import LoginPage from '@/pages/Auth/LoginPage'

const ONBOARDING_KEY = 'zentru-onboarded'

export default function App() {
  const [ready, setReady] = useState(false)
  const [initError, setInitError] = useState<string | null>(null)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const { user, loading: authLoading, initialize } = useUserStore()

  useEffect(() => {
    Promise.all([
      seedDefaultCategories().catch((e) => console.warn('Seed failed:', e)),
      initialize().catch((e) => console.warn('Auth init failed:', e)),
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
    return <LoginPage />
  }

  if (showOnboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} />
  }

  if (useAuthStore.getState().isLocked) {
    return <LockScreen />
  }

  return (
    <DataProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          <Route path="landing" element={<LandingPage />} />
          <Route element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="cards" element={<CardsPage />} />
            <Route path="cards/:id" element={<CardDetailPage />} />
            <Route path="transactions" element={<TransactionsPage />} />
            <Route path="transactions/new" element={<NewTransactionPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="predictions" element={<PredictionsPage />} />
            <Route path="budget" element={<BudgetPage />} />
            <Route path="cashback" element={<CashbackPage />} />
            <Route path="smart" element={<SmartCardPage />} />
            <Route path="recurring" element={<RecurringPage />} />
            <Route path="categories" element={<CategoriesPage />} />
            <Route path="payment-methods" element={<PaymentMethodsPage />} />
            <Route path="import" element={<ImportPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="privacy" element={<PrivacyPolicyPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </DataProvider>
  )
}
