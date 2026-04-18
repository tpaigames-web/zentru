import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import '@/config/i18n'
import './index.css'
import App from './App'

// ---- Build version tracking (for debug only, NOT for forced reload) ----
// Previous implementation auto-reloaded on version mismatch, which caused
// users to lose in-progress work whenever a new deploy was detected.
// Now we just log the version; actual updates are handled by UpdateBanner
// via vite-plugin-pwa's `registerType: 'prompt'` + user confirmation.
const APP_VERSION = __APP_VERSION__
const STORED_VERSION_KEY = 'zentru-app-version'
try {
  const stored = localStorage.getItem(STORED_VERSION_KEY)
  if (stored && stored !== APP_VERSION) {
    console.log(`App version changed: ${stored} → ${APP_VERSION}`)
  }
  localStorage.setItem(STORED_VERSION_KEY, APP_VERSION)
} catch {}

// NOTE: We deliberately do NOT listen for `controllerchange` to auto-reload.
// A forced reload on SW takeover would interrupt users mid-task.
// Instead, the UpdateBanner component uses `registerSW()` to prompt user
// with a dismissible banner, and reload only on explicit user action.

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
