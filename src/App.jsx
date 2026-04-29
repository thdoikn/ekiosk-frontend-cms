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

const queryClient = new QueryClient()

function ProtectedRoute({ children }) {
  const token = useAuthStore((s) => s.token)
  return token ? children : <Navigate to="/login" replace />
}

function StaffRoute({ children }) {
  const user = useAuthStore((s) => s.user)
  return user?.is_staff ? children : <Navigate to="/dashboard" replace />
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
            <Route path="kiosks" element={<StaffRoute><KioskListPage /></StaffRoute>} />
            <Route path="kiosks/:id" element={<StaffRoute><KioskDetailPage /></StaffRoute>} />
            <Route path="regions" element={<StaffRoute><RegionListPage /></StaffRoute>} />
            <Route path="playlists" element={<StaffRoute><PlaylistListPage /></StaffRoute>} />
            <Route path="playlists/:id" element={<StaffRoute><PlaylistBuilderPage /></StaffRoute>} />
            <Route path="media" element={<StaffRoute><MediaPage /></StaffRoute>} />
            {/* <Route path="interactive" element={<StaffRoute><InteractivePage /></StaffRoute>} /> */}
            <Route path="settings" element={<StaffRoute><SettingsPage /></StaffRoute>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
