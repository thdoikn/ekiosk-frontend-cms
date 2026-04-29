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

function StaffPage({ title, children }) {
  const user = useAuthStore((s) => s.user)
  if (user?.is_staff) return children
  return <PermissionDenied title={title} />
}

function PermissionDenied({ title }) {
  return (
    <div style={accessStyles.page}>
      <div style={accessStyles.card}>
        <div style={accessStyles.iconWrap}>
          <LockIcon />
        </div>
        <span style={accessStyles.eyebrow}>{title}</span>
        <h1 style={accessStyles.title}>Anda tidak memiliki izin</h1>
        <p style={accessStyles.text}>
          Akun Anda dapat membuka menu ini, tetapi belum memiliki akses staff untuk melihat data di halaman ini.
          Hubungi superadmin jika Anda membutuhkan akses.
        </p>
      </div>
    </div>
  )
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

const accessStyles = {
  page: {
    width: "100%",
    minHeight: "calc(100vh - 128px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
    color: "#1A1A18",
    animation: "fadeUp 0.4s ease both",
  },
  card: {
    width: "100%",
    maxWidth: "520px",
    background: "#EDEAE6",
    borderRadius: "18px",
    padding: "34px 36px",
    textAlign: "center",
    boxShadow: "6px 6px 14px #D0CCCA, -6px -6px 14px #FFFFFF",
  },
  iconWrap: {
    width: "56px",
    height: "56px",
    borderRadius: "18px",
    margin: "0 auto 18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#C49A3C",
    background: "#EDEAE6",
    boxShadow: "inset 4px 4px 10px #D0CCCA, inset -4px -4px 10px #FFFFFF",
  },
  eyebrow: {
    fontSize: "11px",
    color: "#8A8680",
    letterSpacing: "1.5px",
    textTransform: "uppercase",
    fontWeight: 700,
  },
  title: {
    fontSize: "24px",
    fontWeight: 700,
    margin: "10px 0 8px",
    color: "#2A2520",
  },
  text: {
    fontSize: "13px",
    lineHeight: 1.7,
    color: "#7A7670",
    margin: 0,
  },
}

function LockIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  )
}
