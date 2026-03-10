import { useNavigate, useLocation } from "react-router-dom"
import { useAuthStore } from "../../store/authStore"

const PAGE_TITLES = {
  "/dashboard":   "Dashboard",
  "/kiosks":      "Kiosk Management",
  "/regions":     "Region Management",
  "/playlists":   "Playlist Management",
  "/media":       "Media Library",
  "/interactive": "Interactive Pages",
  "/settings":    "Settings",
}

export default function Topbar() {
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()
  const location = useLocation()

  const title = Object.entries(PAGE_TITLES).find(([path]) =>
    location.pathname.startsWith(path)
  )?.[1] ?? "eKiosk CMS"

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  return (
    <header style={topbarStyles.header}>
      <div>
        <h2 style={topbarStyles.title}>{title}</h2>
      </div>
      <div style={topbarStyles.right}>
        <div style={topbarStyles.userChip}>
          <div style={topbarStyles.avatar}>A</div>
          <span style={topbarStyles.userName}>Admin</span>
        </div>
        <button
          onClick={handleLogout}
          style={topbarStyles.logoutBtn}
          onMouseEnter={e => Object.assign(e.currentTarget.style, topbarStyles.logoutBtnHover)}
          onMouseLeave={e => Object.assign(e.currentTarget.style, topbarStyles.logoutBtn)}
        >
          <LogoutIcon />
          Keluar
        </button>
      </div>
    </header>
  )
}

const topbarStyles = {
  header: {
    height: "60px",
    background: "#FFFFFF",
    borderBottom: "1px solid #E5E0D8",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 32px",
    flexShrink: 0,
    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
  },
  title: {
    fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
    fontSize: "15px",
    fontWeight: 600,
    color: "#4A4845",
    letterSpacing: "0.3px",
  },
  right: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  userChip: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  avatar: {
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #2D6A4F, #C49A3C)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    fontWeight: 600,
    color: "#FFFFFF",
  },
  userName: {
    fontSize: "13px",
    color: "#7A7670",
    fontWeight: 500,
  },
  logoutBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    background: "transparent",
    border: "1px solid #E5E0D8",
    borderRadius: "6px",
    padding: "6px 12px",
    fontSize: "12px",
    color: "#7A7670",
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    transition: "all 0.15s",
  },
  logoutBtnHover: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    background: "rgba(216,58,47,0.06)",
    border: "1px solid rgba(216,58,47,0.2)",
    borderRadius: "6px",
    padding: "6px 12px",
    fontSize: "12px",
    color: "#C0392B",
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    transition: "all 0.15s",
  },
}

function LogoutIcon() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg> }
