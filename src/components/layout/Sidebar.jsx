import { NavLink } from "react-router-dom"
import { useAuthStore } from "../../store/authStore"

const ALL_NAV_ITEMS = [
  { to: "/dashboard",   label: "Dashboard",   icon: DashIcon,    staffOnly: false },
  { to: "/kiosks",      label: "Kiosks",      icon: MonitorIcon, staffOnly: true  },
  { to: "/regions",     label: "Regions",     icon: MapIcon,     staffOnly: true  },
  { to: "/playlists",   label: "Playlists",   icon: ListIcon,    staffOnly: true  },
  { to: "/media",       label: "Media",       icon: ImageIcon,   staffOnly: true  },
  { to: "/interactive", label: "Interactive", icon: ClickIcon,   staffOnly: true  },
  { to: "/settings",    label: "Settings",    icon: GearIcon,    staffOnly: true  },
]

const NM_BG   = "#E4E0DB"
const NM_UP   = "6px 6px 14px #C4BFB8, -6px -6px 14px #FFFFFF"
const NM_IN   = "inset 3px 3px 8px #C4BFB8, inset -3px -3px 8px #FFFFFF"
const NM_SM   = "3px 3px 7px #C4BFB8, -3px -3px 7px #FFFFFF"

export default function Sidebar({ collapsed, onToggle }) {
  const user     = useAuthStore((s) => s.user)
  const isPublic = !user?.is_staff
  const NAV_ITEMS = isPublic ? ALL_NAV_ITEMS.filter(i => !i.staffOnly) : ALL_NAV_ITEMS

  return (
    <aside style={{
      ...s.aside,
      width: collapsed ? "64px" : "220px",
    }}>
      {/* Logo */}
      <div style={{
        ...s.logoArea,
        justifyContent: collapsed ? "center" : "flex-start",
        padding: collapsed ? "20px 0" : "20px 18px",
      }}>
        <div style={s.logoWrap}>
          <img src="/logo.png" alt="Nusantara" style={{ width: "30px", height: "30px", objectFit: "contain" }} />
        </div>
        {!collapsed && (
          <div style={s.logoText}>
            <span style={s.logoTitle}>eKiosk</span>
            <span style={s.logoSub}>IKN · CMS</span>
          </div>
        )}
      </div>

      {!collapsed && (
        <div style={s.sectionLabel}>NAVIGASI</div>
      )}

      <nav style={{ ...s.nav, padding: collapsed ? "0 10px" : "0 12px" }}>
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            title={collapsed ? label : undefined}
            style={({ isActive }) => ({
              ...s.navItem,
              justifyContent: collapsed ? "center" : "flex-start",
              padding: collapsed ? "11px" : "10px 14px",
              boxShadow: isActive ? NM_IN : "none",
              background: NM_BG,
            })}
          >
            {({ isActive }) => (
              <>
                <span style={{
                  ...s.navIcon,
                  color: isActive ? "#C49A3C" : "#8A8680",
                  filter: isActive ? "drop-shadow(0 0 4px rgba(196,154,60,0.4))" : "none",
                }}>
                  <Icon />
                </span>
                {!collapsed && (
                  <span style={{
                    ...s.navLabel,
                    color: isActive ? "#2A2520" : "#6A6560",
                    fontWeight: isActive ? 600 : 400,
                  }}>
                    {label}
                  </span>
                )}
                {isActive && !collapsed && (
                  <span style={s.activeAccent} />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div style={{
        ...s.bottom,
        padding: collapsed ? "14px 10px" : "14px 12px",
      }}>
        {!collapsed && (
          <div style={s.statusPill}>
            <span style={s.statusDot} />
            <span style={s.statusText}>IKN Nusantara</span>
          </div>
        )}
        <button
          onClick={onToggle}
          title={collapsed ? "Expand" : "Collapse"}
          style={s.toggleBtn}
          onMouseEnter={e => Object.assign(e.currentTarget.style, { boxShadow: NM_IN, color: "#C49A3C" })}
          onMouseLeave={e => Object.assign(e.currentTarget.style, { boxShadow: NM_SM, color: "#8A8680" })}
        >
          <CollapseIcon collapsed={collapsed} />
        </button>
      </div>

      <style>{`
        aside { transition: width 0.22s cubic-bezier(0.4,0,0.2,1); }
        a { text-decoration: none; }
      `}</style>
    </aside>
  )
}

const s = {
  aside: {
    background: "#E4E0DB",
    display: "flex",
    flexDirection: "column",
    flexShrink: 0,
    height: "100vh",
    overflow: "hidden",
    boxShadow: "4px 0 20px rgba(0,0,0,0.06)",
  },
  logoArea: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "8px",
  },
  logoWrap: {
    width: "40px",
    height: "40px",
    borderRadius: "12px",
    background: "#E4E0DB",
    boxShadow: "3px 3px 7px #C4BFB8, -3px -3px 7px #FFFFFF",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  logoText: {
    display: "flex",
    flexDirection: "column",
    gap: "1px",
  },
  logoTitle: {
    fontFamily: "'Inter', sans-serif",
    fontSize: "17px",
    fontWeight: 700,
    color: "#2A2520",
    letterSpacing: "0.5px",
    lineHeight: 1,
  },
  logoSub: {
    fontSize: "9px",
    letterSpacing: "2px",
    color: "#C49A3C",
    textTransform: "uppercase",
    fontWeight: 600,
  },
  sectionLabel: {
    fontSize: "9px",
    letterSpacing: "2px",
    color: "#B0AAA2",
    fontWeight: 700,
    padding: "8px 24px 6px",
    textTransform: "uppercase",
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    flex: 1,
  },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: "11px",
    borderRadius: "12px",
    position: "relative",
    transition: "box-shadow 0.18s, background 0.18s",
  },
  navIcon: {
    flexShrink: 0,
    width: "16px",
    height: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "color 0.15s",
  },
  navLabel: {
    fontSize: "13px",
    transition: "color 0.15s",
    whiteSpace: "nowrap",
    overflow: "hidden",
  },
  activeAccent: {
    position: "absolute",
    right: "12px",
    width: "5px",
    height: "5px",
    borderRadius: "50%",
    background: "#C49A3C",
    boxShadow: "0 0 6px rgba(196,154,60,0.6)",
  },
  bottom: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginTop: "auto",
    paddingTop: "12px",
  },
  statusPill: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    background: "#E4E0DB",
    boxShadow: "inset 2px 2px 5px #C4BFB8, inset -2px -2px 5px #FFFFFF",
    borderRadius: "20px",
    padding: "6px 12px",
  },
  statusDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "#418840",
    flexShrink: 0,
    boxShadow: "0 0 5px rgba(65,136,64,0.6)",
  },
  statusText: {
    fontSize: "10px",
    color: "#8A8680",
    letterSpacing: "0.3px",
    whiteSpace: "nowrap",
  },
  toggleBtn: {
    background: "#E4E0DB",
    border: "none",
    borderRadius: "10px",
    width: "34px",
    height: "34px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "#8A8680",
    padding: 0,
    flexShrink: 0,
    boxShadow: "3px 3px 7px #C4BFB8, -3px -3px 7px #FFFFFF",
    transition: "all 0.18s",
    alignSelf: "flex-end",
  },
}

function CollapseIcon({ collapsed }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      {collapsed ? <polyline points="9 18 15 12 9 6" /> : <polyline points="15 18 9 12 15 6" />}
    </svg>
  )
}

function DashIcon()    { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> }
function MonitorIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg> }
function MapIcon()     { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg> }
function ListIcon()    { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="3" cy="6" r="1" fill="currentColor"/><circle cx="3" cy="12" r="1" fill="currentColor"/><circle cx="3" cy="18" r="1" fill="currentColor"/></svg> }
function ImageIcon()   { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg> }
function ClickIcon()   { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 9l5 12 1.8-5.2L21 14z"/><path d="M7.2 2.2L8 5.1"/><path d="M5.1 8l-2.9-.8"/><path d="M14.8 2.2L14 5.1"/><path d="M18.9 8l2.9-.8"/></svg> }
function GearIcon()    { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg> }
