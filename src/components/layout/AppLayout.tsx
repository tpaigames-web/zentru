import { Outlet } from 'react-router'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { useInitStores } from '@/hooks/useInitStores'
import { useNotificationNavigation } from '@/hooks/useNotificationNavigation'
import { useAutoSync } from '@/hooks/useAutoSync'

export function AppLayout() {
  useInitStores()
  useNotificationNavigation()
  useAutoSync()

  return (
    <div className="flex h-full w-full overflow-hidden">
      <Sidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto pb-[calc(3.5rem+1rem+env(safe-area-inset-bottom))] md:pb-4">
          <div className="mx-auto max-w-5xl px-3 py-3 md:px-4 md:py-4">
            <Outlet />
          </div>
        </main>

        <BottomNav />
      </div>
    </div>
  )
}
