import { NavLink } from "react-router-dom"

const NAV_ITEMS = [
  { to: "/dashboard",   label: "Dashboard",   icon: DashIcon   },
  { to: "/kiosks",      label: "Kiosks",      icon: MonitorIcon },
  { to: "/regions",     label: "Regions",     icon: MapIcon    },
  { to: "/playlists",   label: "Playlists",   icon: ListIcon   },
  { to: "/media",       label: "Media",       icon: ImageIcon  },
  { to: "/interactive", label: "Interactive", icon: ClickIcon  },
  { to: "/settings",    label: "Settings",    icon: GearIcon   },
]

export default function Sidebar({ collapsed, onToggle }) {
  return (
    <aside style={{
      ...sidebarStyles.aside,
      width: collapsed ? "60px" : "220px",
    }}>
      {/* Logo */}
      <div style={{
        ...sidebarStyles.logoArea,
        justifyContent: collapsed ? "center" : "flex-start",
        padding: collapsed ? "24px 0" : "24px 20px",
      }}>
        <div style={sidebarStyles.logoMark}>
          <svg width="28" height="28" viewBox="0 0 48 48" fill="none">
            <polygon points="24,4 44,14 44,34 24,44 4,34 4,14" fill="none" stroke="#d5b57e" strokeWidth="2.5" />
            <circle cx="24" cy="24" r="6" fill="#d5b57e" />
          </svg>
        </div>
        {!collapsed && (
          <div style={sidebarStyles.logoText}>
            <span style={sidebarStyles.logoTitle}>eKiosk</span>
            <span style={sidebarStyles.logoSub}>CMS</span>
          </div>
        )}
      </div>

      {!collapsed && <div style={sidebarStyles.navLabel}>NAVIGASI</div>}

      <nav style={{ ...sidebarStyles.nav, padding: collapsed ? "0 6px" : "0 10px" }}>
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            title={collapsed ? label : undefined}
            style={({ isActive }) => ({
              ...sidebarStyles.navItem,
              justifyContent: collapsed ? "center" : "flex-start",
              padding: collapsed ? "10px" : "10px 12px",
              ...(isActive ? sidebarStyles.navItemActive : {}),
            })}
          >
            {({ isActive }) => (
              <>
                <span style={{
                  ...sidebarStyles.navIcon,
                  color: isActive ? "#d5b57e" : "#5a5956",
                }}>
                  <Icon />
                </span>
                {!collapsed && (
                  <span style={{
                    ...sidebarStyles.navLabel2,
                    color: isActive ? "#fff9eb" : "#808180",
                  }}>
                    {label}
                  </span>
                )}
                {isActive && !collapsed && <span style={sidebarStyles.activeBar} />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom area */}
      <div style={{
        ...sidebarStyles.bottom,
        padding: collapsed ? "16px 0" : "16px 20px",
        alignItems: "center",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}>
        {!collapsed && (
          <div style={sidebarStyles.bottomBadge}>
            <span style={sidebarStyles.bottomDot} />
            <span style={sidebarStyles.bottomText}>IKN Nusantara</span>
          </div>
        )}
        <button
          onClick={onToggle}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          style={sidebarStyles.toggleBtn}
          onMouseEnter={e => Object.assign(e.currentTarget.style, sidebarStyles.toggleBtnHover)}
          onMouseLeave={e => Object.assign(e.currentTarget.style, sidebarStyles.toggleBtn)}
        >
          <CollapseIcon collapsed={collapsed} />
        </button>
      </div>

      <style>{`
        aside { transition: width 0.22s cubic-bezier(0.4,0,0.2,1); }
      `}</style>
    </aside>
  )
}

const sidebarStyles = {
  aside: {
    background: "#1e1e1c",
    borderRight: "1px solid #2e2e2a",
    display: "flex",
    flexDirection: "column",
    flexShrink: 0,
    height: "100vh",
    overflow: "hidden",
  },
  logoArea: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    borderBottom: "1px solid #2e2e2a",
  },
  logoMark: { flexShrink: 0 },
  logoText: {
    display: "flex",
    flexDirection: "column",
    gap: "1px",
    overflow: "hidden",
  },
  logoTitle: {
    fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
    fontSize: "18px",
    fontWeight: 600,
    color: "#fff9eb",
    letterSpacing: "1px",
    lineHeight: 1,
    whiteSpace: "nowrap",
  },
  logoSub: {
    fontSize: "9px",
    letterSpacing: "3px",
    color: "#d5b57e",
    textTransform: "uppercase",
    fontWeight: 500,
  },
  navLabel: {
    fontSize: "9px",
    letterSpacing: "2px",
    color: "#3a3a36",
    fontWeight: 600,
    padding: "20px 20px 8px",
    textTransform: "uppercase",
    whiteSpace: "nowrap",
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    flex: 1,
  },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    borderRadius: "8px",
    textDecoration: "none",
    position: "relative",
    transition: "background 0.15s",
  },
  navItemActive: {
    background: "rgba(42,79,133,0.2)",
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
  navLabel2: {
    fontSize: "13px",
    fontWeight: 500,
    transition: "color 0.15s",
    whiteSpace: "nowrap",
    overflow: "hidden",
  },
  activeBar: {
    position: "absolute",
    right: "10px",
    width: "4px",
    height: "4px",
    borderRadius: "50%",
    background: "#d5b57e",
  },
  bottom: {
    borderTop: "1px solid #2e2e2a",
  },
  bottomBadge: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    width: "100%",
  },
  bottomDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "#418840",
    flexShrink: 0,
  },
  bottomText: {
    fontSize: "11px",
    color: "#5a5956",
    letterSpacing: "0.5px",
    whiteSpace: "nowrap",
  },
  toggleBtn: {
    background: "transparent",
    border: "1px solid #2e2e2a",
    borderRadius: "6px",
    width: "28px",
    height: "28px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "#5a5956",
    padding: 0,
    flexShrink: 0,
    transition: "all 0.15s",
  },
  toggleBtnHover: {
    background: "rgba(213,181,126,0.1)",
    border: "1px solid #3a3a36",
    borderRadius: "6px",
    width: "28px",
    height: "28px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "#d5b57e",
    padding: 0,
    flexShrink: 0,
    transition: "all 0.15s",
  },
}

function CollapseIcon({ collapsed }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      {collapsed
        ? <><polyline points="9 18 15 12 9 6" /></>
        : <><polyline points="15 18 9 12 15 6" /></>
      }
    </svg>
  )
}

function DashIcon()    { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg> }
function MonitorIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg> }
function MapIcon()     { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg> }
function ListIcon()    { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="3" cy="6" r="1" fill="currentColor"/><circle cx="3" cy="12" r="1" fill="currentColor"/><circle cx="3" cy="18" r="1" fill="currentColor"/></svg> }
function ImageIcon()   { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg> }
function ClickIcon()   { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 9l5 12 1.8-5.2L21 14z"/><path d="M7.2 2.2L8 5.1"/><path d="M5.1 8l-2.9-.8"/><path d="M14.8 2.2L14 5.1"/><path d="M18.9 8l2.9-.8"/></svg> }
function GearIcon()    { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg> }
