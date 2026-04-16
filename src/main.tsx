import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import '@/config/i18n'
import './index.css'
import App from './App'

// ---- Cache-busting version check ----
// Build timestamp is injected at build time. If it changes,
// old service workers and caches are purged automatically.
const APP_VERSION = __APP_VERSION__

const STORED_VERSION_KEY = 'zentru-app-version'
const storedVersion = localStorage.getItem(STORED_VERSION_KEY)

if (storedVersion && storedVersion !== APP_VERSION) {
  // Version mismatch — purge all caches and service workers, then reload
  console.log(`App updated: ${storedVersion} → ${APP_VERSION}. Clearing caches...`)
  localStorage.setItem(STORED_VERSION_KEY, APP_VERSION)

  // Clear all caches
  if ('caches' in window) {
    caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)))
  }
  // Unregister all service workers
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((r) => r.unregister())
    })
  }
  // Reload after a short delay to let cleanup finish
  setTimeout(() => window.location.reload(), 300)
} else {
  // Store current version
  localStorage.setItem(STORED_VERSION_KEY, APP_VERSION)
}

// Auto-update: when new service worker takes control, reload
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload()
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
