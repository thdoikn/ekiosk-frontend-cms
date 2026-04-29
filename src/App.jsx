import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from './store/authStore'

import AppLayout from './components/layout/AppLayout'
import LoginPage from './pages/auth/LoginPage'
import OidcCallbackPage from './pages/auth/OidcCallbackPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import KioskListPage from './pages/kiosks/KioskListPage'
import KioskDetailPage from './pages/kiosks/KioskDetailPage'
import RegionListPage from './pages/regions/RegionListPage'
import PlaylistListPage from './pages/playlists/PlaylistListPage'
import PlaylistBuilderPage from './pages/playlists/PlaylistBuilderPage'
import MediaPage from './pages/media/MediaPage'
// import InteractivePage from './pages/interactive/InteractivePage'
import SettingsPage from './pages/settings/SettingsPage'
import { PermissionState } from './ui'

const queryClient = new QueryClient()

function ProtectedRoute({ children }) {
  const token = useAuthStore((s) => s.token)
  return token ? children : <Navigate to="/login" replace />
}

function StaffPage({ title, children }) {
  const user = useAuthStore((s) => s.user)
  if (user?.is_staff) return children
  return <PermissionState pageTitle={title} />
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<OidcCallbackPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="kiosks" element={<StaffPage title="Kiosk Management"><KioskListPage /></StaffPage>} />
            <Route path="kiosks/:id" element={<StaffPage title="Kiosk Management"><KioskDetailPage /></StaffPage>} />
            <Route path="regions" element={<StaffPage title="Region Management"><RegionListPage /></StaffPage>} />
            <Route path="playlists" element={<StaffPage title="Playlist Management"><PlaylistListPage /></StaffPage>} />
            <Route path="playlists/:id" element={<StaffPage title="Playlist Management"><PlaylistBuilderPage /></StaffPage>} />
            <Route path="media" element={<StaffPage title="Media Library"><MediaPage /></StaffPage>} />
            {/* <Route path="interactive" element={<StaffPage title="Interactive Pages"><InteractivePage /></StaffPage>} /> */}
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
