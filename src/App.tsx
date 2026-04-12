import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router'
import { DataProvider } from '@/data/DataProvider'
import { seedDefaultCategories } from '@/data/seed'
import { AppLayout } from '@/components/layout/AppLayout'
import { Onboarding } from '@/pages/Onboarding'
import { LockScreen } from '@/components/LockScreen'
import { useAuthStore } from '@/stores/useAuthStore'
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

const ONBOARDING_KEY = 'zentru-onboarded'

export default function App() {
  const [ready, setReady] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    seedDefaultCategories().then(() => {
      const onboarded = localStorage.getItem(ONBOARDING_KEY)
      if (!onboarded) setShowOnboarding(true)
      setReady(true)
    })
  }, [])

  const handleOnboardingComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, '1')
    setShowOnboarding(false)
  }

  if (!ready) return null

  if (showOnboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} />
  }

  if (useAuthStore.getState().isLocked) {
    return <LockScreen />
  }

  return (
    <DataProvider>
      <BrowserRouter>
        <Routes>
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
          </Route>
        </Routes>
      </BrowserRouter>
    </DataProvider>
  )
}
