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

function toTitleCase(str) {
  if (!str) return ""
  return str.replace(/\S+/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
}

export default function Topbar() {
  const logout   = useAuthStore((s) => s.logout)
  const user     = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const location = useLocation()

  const title = Object.entries(PAGE_TITLES).find(([path]) =>
    location.pathname.startsWith(path)
  )?.[1] ?? "eKiosk CMS"

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  const fullName = toTitleCase(
    [user?.first_name, user?.last_name].filter(Boolean).join(" ") || user?.username || "User"
  )
  const initials = fullName.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase()

  return (
    <header style={s.header}>
      <div style={s.left}>
        <h2 style={s.title}>{title}</h2>
        <span style={s.breadcrumb}>eKiosk IKN · Nusantara</span>
      </div>

      <div style={s.right}>
        <div style={s.userPill}>
          <div style={s.avatar}>{initials}</div>
          <div style={s.userInfo}>
            <span style={s.userName}>{fullName}</span>
            <span style={s.userRole}>{user?.is_superuser ? "Superadmin" : user?.is_staff ? "Staff" : "Publik"}</span>
          </div>
        </div>

        {user?.is_superuser && (
          <a
            href={window.location.origin + "/admin/"}
            target="_blank"
            rel="noopener noreferrer"
            style={s.adminBtn}
            onMouseEnter={e => Object.assign(e.currentTarget.style, s.adminBtnHover)}
            onMouseLeave={e => Object.assign(e.currentTarget.style, s.adminBtn)}
            title="Django Admin"
          >
            <AdminIcon />
            <span>Admin</span>
          </a>
        )}

        <button
          onClick={handleLogout}
          style={s.logoutBtn}
          onMouseEnter={e => Object.assign(e.currentTarget.style, s.logoutBtnHover)}
          onMouseLeave={e => Object.assign(e.currentTarget.style, s.logoutBtn)}
          title="Keluar"
        >
          <LogoutIcon />
          <span>Keluar</span>
        </button>
      </div>
    </header>
  )
}

const s = {
  header: {
    height: "64px",
    background: "#EDEAE6",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 32px",
    flexShrink: 0,
    boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
    position: "relative",
    zIndex: 10,
  },
  left: {
    display: "flex",
    flexDirection: "column",
    gap: "1px",
  },
  title: {
    fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
    fontSize: "16px",
    fontWeight: 700,
    color: "#2A2520",
    letterSpacing: "0.2px",
    margin: 0,
  },
  breadcrumb: {
    fontSize: "11px",
    color: "#A8A49C",
    letterSpacing: "0.3px",
    fontWeight: 400,
  },
  right: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  userPill: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "#EDEAE6",
    boxShadow: "inset 3px 3px 7px #D0CCCA, inset -3px -3px 7px #FFFFFF",
    borderRadius: "30px",
    padding: "6px 14px 6px 6px",
  },
  avatar: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #2D6A4F, #C49A3C)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "11px",
    fontWeight: 700,
    color: "#FFFFFF",
    flexShrink: 0,
    boxShadow: "2px 2px 5px rgba(0,0,0,0.15)",
  },
  userInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "1px",
  },
  userName: {
    fontSize: "12px",
    fontWeight: 600,
    color: "#2A2520",
    lineHeight: 1,
    whiteSpace: "nowrap",
  },
  userRole: {
    fontSize: "10px",
    color: "#A8A49C",
    lineHeight: 1,
    fontWeight: 400,
  },
  adminBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    background: "#EDEAE6",
    border: "none",
    borderRadius: "10px",
    padding: "8px 14px",
    fontSize: "12px",
    fontWeight: 500,
    color: "#2D6A4F",
    cursor: "pointer",
    fontFamily: "'Inter', sans-serif",
    textDecoration: "none",
    boxShadow: "3px 3px 7px #D0CCCA, -3px -3px 7px #FFFFFF",
    transition: "all 0.18s",
  },
  adminBtnHover: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    background: "#EDEAE6",
    border: "none",
    borderRadius: "10px",
    padding: "8px 14px",
    fontSize: "12px",
    fontWeight: 500,
    color: "#1A4A33",
    cursor: "pointer",
    fontFamily: "'Inter', sans-serif",
    textDecoration: "none",
    boxShadow: "inset 3px 3px 7px #D0CCCA, inset -3px -3px 7px #FFFFFF",
    transition: "all 0.18s",
  },
  logoutBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    background: "#EDEAE6",
    border: "none",
    borderRadius: "10px",
    padding: "8px 14px",
    fontSize: "12px",
    fontWeight: 500,
    color: "#7A7670",
    cursor: "pointer",
    fontFamily: "'Inter', sans-serif",
    boxShadow: "3px 3px 7px #D0CCCA, -3px -3px 7px #FFFFFF",
    transition: "all 0.18s",
  },
  logoutBtnHover: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    background: "#EDEAE6",
    border: "none",
    borderRadius: "10px",
    padding: "8px 14px",
    fontSize: "12px",
    fontWeight: 500,
    color: "#C0392B",
    cursor: "pointer",
    fontFamily: "'Inter', sans-serif",
    boxShadow: "inset 3px 3px 7px #D0CCCA, inset -3px -3px 7px #FFFFFF",
    transition: "all 0.18s",
  },
}

function AdminIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  )
}

function LogoutIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  )
}
