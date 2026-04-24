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
import InteractivePage from './pages/interactive/InteractivePage'
import SettingsPage from './pages/settings/SettingsPage'

const queryClient = new QueryClient()

function ProtectedRoute({ children }) {
  const token = useAuthStore((s) => s.token)
  return token ? children : <Navigate to="/login" replace />
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
            <Route path="kiosks" element={<KioskListPage />} />
            <Route path="kiosks/:id" element={<KioskDetailPage />} />
            <Route path="regions" element={<RegionListPage />} />
            <Route path="playlists" element={<PlaylistListPage />} />
            <Route path="playlists/:id" element={<PlaylistBuilderPage />} />
            <Route path="media" element={<MediaPage />} />
            <Route path="interactive" element={<InteractivePage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
