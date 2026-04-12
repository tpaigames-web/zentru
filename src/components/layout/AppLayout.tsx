import { Outlet } from 'react-router'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { useInitStores } from '@/hooks/useInitStores'
import { useNotificationNavigation } from '@/hooks/useNotificationNavigation'

export function AppLayout() {
  useInitStores()
  useNotificationNavigation()

  return (
    <div className="flex h-full w-full overflow-hidden">
      <Sidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto pb-18 md:pb-4">
          <div className="mx-auto max-w-5xl px-3 py-3 md:px-4 md:py-4">
            <Outlet />
          </div>
        </main>

        <BottomNav />
      </div>
    </div>
  )
}
