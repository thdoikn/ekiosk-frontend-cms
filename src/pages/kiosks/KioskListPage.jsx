import { useState, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import client from "../../api/client"

// ── API ────────────────────────────────────────────────────
const fetchKiosks    = () => client.get("/kiosks/").then(r => r.data)
const fetchRegions   = () => client.get("/regions/").then(r => r.data)
const doForceUpdate  = (id) => client.post(`/kiosks/${id}/force-update/`)
const doSetStatus    = ({ id, operational_status }) =>
  client.post(`/kiosks/${id}/set-status/`, { operational_status })

// ── Helpers ────────────────────────────────────────────────
const STATUS_CFG = {
  operational:  { label: "Operational",  bg: "#E8F4EC", text: "#2D6A4F", dot: "#418840" },
  stale:        { label: "Stale",        bg: "#FEF5E7", text: "#9B7228", dot: "#C49A3C" },
  maintenance:  { label: "Maintenance",  bg: "#E3F2FD", text: "#1565C0", dot: "#1976D2" },
  out_of_order: { label: "Out of Order", bg: "#FDECEA", text: "#C0392B", dot: "#D83A2F" },
  disconnected: { label: "Disconnected", bg: "#F3F2F0", text: "#6A6860", dot: "#9A9890" },
  pending:      { label: "Pending",      bg: "#FAFAFA", text: "#9E9E9E", dot: "#BDBDBD" },
}

// foreground = app is open on screen
// background = app running but screen is off / another app on front
// terminated = app was force-closed or crashed
const APP_STATE_CFG = {
  foreground: { label: "Aktif",          sub: "Layar menyala",          icon: "▶", color: "#2D6A4F", bg: "#E8F4EC" },
  background: { label: "Latar Belakang", sub: "Berjalan di balik layar", icon: "◑", color: "#1b818a", bg: "#E6F4F5" },
  terminated: { label: "Tidak Aktif",    sub: "Aplikasi dihentikan",    icon: "■", color: "#C0392B", bg: "#FDECEA" },
}

function timeSince(dateStr) {
  if (!dateStr) return "Never"
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (diff < 60)    return `${diff}s ago`
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.pending
  return (
    <span style={{ ...S.badge, background: cfg.bg, color: cfg.text }}>
      <span style={{ ...S.badgeDot, background: cfg.dot }} />
      {cfg.label}
    </span>
  )
}

function ActionBtn({ onClick, variant = "ghost", disabled, children }) {
  const base = variant === "danger" ? S.btnDanger : variant === "primary" ? S.btnPrimary : S.btnGhost
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={disabled ? { ...base, opacity: 0.4, cursor: "not-allowed" } : base}
      onMouseEnter={e => !disabled && (e.currentTarget.style.opacity = "0.7")}
      onMouseLeave={e => !disabled && (e.currentTarget.style.opacity = "1")}
    >
      {children}
    </button>
  )
}

// ── Main ───────────────────────────────────────────────────
export default function KioskListPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [search, setSearch]       = useState("")
  const [regionFilter, setRegion] = useState("all")
  const [statusFilter, setStatus] = useState("all")
  const [forcingId, setForcingId] = useState(null)
  const [statusMenuId, setStatusMenuId] = useState(null)

  const { data: kioskData, isLoading } = useQuery({
    queryKey: ["kiosks"],
    queryFn: fetchKiosks,
    refetchInterval: 30000,
  })

  const { data: regionData } = useQuery({
    queryKey: ["regions"],
    queryFn: fetchRegions,
  })

  const forceMut = useMutation({
    mutationFn: doForceUpdate,
    onMutate: (id) => setForcingId(id),
    onSettled: () => { setForcingId(null); qc.invalidateQueries(["kiosks"]) },
  })

  const statusMut = useMutation({
    mutationFn: doSetStatus,
    onSettled: () => { setStatusMenuId(null); qc.invalidateQueries(["kiosks"]) },
  })

  const kiosks = useMemo(() =>
    [...(kioskData?.results ?? kioskData ?? [])].sort((a, b) => {
      const ra = a.region?.name ?? ''
      const rb = b.region?.name ?? ''
      if (ra !== rb) return ra.localeCompare(rb, 'id')
      return a.name.localeCompare(b.name, 'id')
    }),
    [kioskData]
  )
  const regions = regionData?.results ?? regionData ?? []

  const filtered = kiosks.filter(k => {
    const matchSearch = k.name.toLowerCase().includes(search.toLowerCase()) ||
      (k.last_ip_address ?? "").includes(search)
    const matchRegion = regionFilter === "all" || k.region?.id === regionFilter
    const matchStatus = statusFilter === "all" || k.status === statusFilter
    return matchSearch && matchRegion && matchStatus
  })

  const counts = kiosks.reduce((acc, k) => {
    acc[k.status] = (acc[k.status] || 0) + 1
    return acc
  }, {})

  return (
    <div style={S.page}>
      <style>{ANIM_CSS}</style>

      {/* Header */}
      <div style={S.header}>
        <div>
          <h1 style={S.pageTitle}>Kiosk Management</h1>
          <p style={S.pageSub}>
            {kiosks.length} kiosk terdaftar
            {filtered.length !== kiosks.length && ` · ${filtered.length} ditampilkan`}
          </p>
        </div>
      </div>

      {/* Status summary strip */}
      <div style={S.statusStrip}>
        {Object.entries(STATUS_CFG).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => setStatus(statusFilter === key ? "all" : key)}
            style={statusFilter === key ? S.stripItemActive : S.stripItem}
          >
            <span style={{ ...S.stripDot, background: cfg.dot }} />
            <span style={{ ...S.stripCount, color: statusFilter === key ? cfg.text : "#1A1A18" }}>{counts[key] ?? 0}</span>
            <span style={S.stripLabel}>{cfg.label}</span>
          </button>
        ))}
      </div>

      {/* Filters row */}
      <div style={S.filtersRow}>
        {/* Search */}
        <div style={S.searchWrap}>
          <SearchIcon />
          <input
            style={S.searchInput}
            placeholder="Cari nama atau IP kiosk..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button style={S.clearBtn} onClick={() => setSearch("")}>✕</button>
          )}
        </div>

        {/* Region filter */}
        <select
          style={S.select}
          value={regionFilter}
          onChange={e => setRegion(e.target.value)}
        >
          <option value="all">Semua Region</option>
          {regions.map(r => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div style={S.tableWrap}>
        {isLoading ? (
          <div style={S.loadingWrap}>
            {[...Array(5)].map((_, i) => (
              <div key={i} style={{ ...S.skeletonRow, animationDelay: `${i * 0.08}s` }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={S.empty}>
            <span style={S.emptyIcon}>◫</span>
            <p style={S.emptyText}>Tidak ada kiosk yang cocok dengan filter</p>
            <button style={S.emptyReset} onClick={() => { setSearch(""); setRegion("all"); setStatus("all") }}>
              Reset Filter
            </button>
          </div>
        ) : (
          <table style={S.table}>
            <thead>
              <tr>
                {["Nama Kiosk", "Region", "Status", "Playlist Aktif", "Heartbeat Terakhir", "IP Address", "Aksi"].map((h, hi, arr) => (
                  <th key={h} style={{
                    ...S.th,
                    borderRadius: hi === 0 ? "12px 0 0 0" : hi === arr.length - 1 ? "0 12px 0 0" : undefined,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((kiosk, i) => (
                <tr
                  key={kiosk.id}
                  style={{
                    ...S.tr,
                    // Do NOT put animation here — transform in keyframes creates a stacking
                    // context per row that traps absolutely-positioned dropdowns inside it.
                    position: statusMenuId === kiosk.id ? "relative" : undefined,
                    zIndex:   statusMenuId === kiosk.id ? 10 : undefined,
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(196,191,184,0.2)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <td style={S.td}>
                    <div style={S.kioskNameCell}>
                      <div style={{
                        ...S.kioskDot,
                        background: STATUS_CFG[kiosk.status]?.dot ?? "#9A9890"
                      }} />
                      <div>
                        <button
                          style={S.kioskNameBtn}
                          onClick={() => navigate(`/kiosks/${kiosk.id}`)}
                        >
                          {kiosk.name}
                        </button>
                        <p style={S.kioskId}>
                          {String(kiosk.id).slice(0, 8)}…
                        </p>
                      </div>
                    </div>
                  </td>
                  <td style={S.td}>
                    <span style={S.regionChip}>
                      {kiosk.region?.name ?? <span style={{ color: "#A8A49C" }}>—</span>}
                    </span>
                  </td>
                  <td style={S.td}>
                    <StatusBadge status={kiosk.status} />
                    {kiosk.last_app_state && APP_STATE_CFG[kiosk.last_app_state] && (
                      <div style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        marginTop: "4px",
                        background: APP_STATE_CFG[kiosk.last_app_state].bg,
                        color: APP_STATE_CFG[kiosk.last_app_state].color,
                        borderRadius: "10px",
                        padding: "2px 8px",
                        fontSize: "10px",
                        fontWeight: 500,
                        whiteSpace: "nowrap",
                      }}>
                        <span>{APP_STATE_CFG[kiosk.last_app_state].icon}</span>
                        <span>{APP_STATE_CFG[kiosk.last_app_state].label}</span>
                      </div>
                    )}
                  </td>
                  <td style={S.td}>
                    <span style={S.playlistText}>
                      {kiosk.active_playlist?.name ?? <span style={{ color: "#A8A49C" }}>Tidak ada</span>}
                    </span>
                  </td>
                  <td style={S.td}>
                    <span style={{
                      ...S.heartbeatText,
                      color: kiosk.status === "disconnected" ? "#C0392B" : "#7A7670"
                    }}>
                      {timeSince(kiosk.last_heartbeat)}
                    </span>
                  </td>
                  <td style={S.td}>
                    <span style={S.ipText}>{kiosk.last_ip_address ?? "—"}</span>
                  </td>
                  <td style={S.td}>
                    <div style={S.actionsCell}>
                      <ActionBtn
                        onClick={() => navigate(`/kiosks/${kiosk.id}`)}
                        variant="ghost"
                      >
                        <DetailIcon /> Detail
                      </ActionBtn>
                      <ActionBtn
                        onClick={() => forceMut.mutate(kiosk.id)}
                        disabled={forcingId === kiosk.id || kiosk.status === "pending"}
                        variant="ghost"
                      >
                        {forcingId === kiosk.id ? "…" : <><RefreshIcon /> Update</>}
                      </ActionBtn>
                      <div style={{ position: "relative" }}>
                        <ActionBtn
                          onClick={() => setStatusMenuId(statusMenuId === kiosk.id ? null : kiosk.id)}
                          variant="ghost"
                        >
                          <WrenchIcon /> Status
                        </ActionBtn>
                        {statusMenuId === kiosk.id && (
                          <div style={S.statusMenu}>
                            <button
                              style={S.statusMenuItem}
                              onClick={() => statusMut.mutate({ id: kiosk.id, operational_status: null })}
                            >
                              <span style={{ ...S.menuDot, background: "#418840" }} /> Otomatis
                            </button>
                            <button
                              style={S.statusMenuItem}
                              onClick={() => statusMut.mutate({ id: kiosk.id, operational_status: "maintenance" })}
                            >
                              <span style={{ ...S.menuDot, background: "#1976D2" }} /> Maintenance
                            </button>
                            <button
                              style={S.statusMenuItem}
                              onClick={() => statusMut.mutate({ id: kiosk.id, operational_status: "out_of_order" })}
                            >
                              <span style={{ ...S.menuDot, background: "#D83A2F" }} /> Out of Order
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// ── Icons ──────────────────────────────────────────────────
function SearchIcon() {
  return (
    <svg style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#A8A49C" }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  )
}
function DetailIcon()  { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight:4}}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> }
function RefreshIcon() { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight:4}}><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg> }
function WrenchIcon() { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight:4}}><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg> }

// ── Neuromorphic tokens ────────────────────────────────────
const NM   = "#EDEAE6"
const NM_U = "6px 6px 14px #D0CCCA, -6px -6px 14px #FFFFFF"
const NM_S = "4px 4px 10px #D0CCCA, -4px -4px 10px #FFFFFF"
const NM_I = "inset 4px 4px 10px #D0CCCA, inset -4px -4px 10px #FFFFFF"
const NM_I_SM = "inset 3px 3px 7px #D0CCCA, inset -3px -3px 7px #FFFFFF"

// ── Styles ─────────────────────────────────────────────────
const ANIM_CSS = `
  @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes shimmer { 0%{background-position:-600px 0} 100%{background-position:600px 0} }
`

const S = {
  page: {
    fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
    color: "#1A1A18",
    width: "100%",
    animation: "fadeUp 0.4s ease both",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "24px",
  },
  pageTitle: {
    fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
    fontSize: "26px",
    fontWeight: 600,
    color: "#1A1A18",
    margin: "0 0 4px",
    letterSpacing: "0.5px",
  },
  pageSub: {
    fontSize: "13px",
    color: "#7A7670",
    margin: 0,
    fontWeight: 300,
  },

  // Status strip
  statusStrip: {
    display: "flex",
    gap: "10px",
    marginBottom: "20px",
    flexWrap: "wrap",
  },
  stripItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 16px",
    borderRadius: "10px",
    border: "none",
    cursor: "pointer",
    transition: "box-shadow 0.18s",
    fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
    background: NM,
    boxShadow: NM_S,
  },
  stripItemActive: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 16px",
    borderRadius: "10px",
    border: "none",
    cursor: "pointer",
    transition: "box-shadow 0.18s",
    fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
    background: NM,
    boxShadow: NM_I,
  },
  stripDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    flexShrink: 0,
  },
  stripCount: {
    fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
    fontSize: "20px",
    fontWeight: 600,
    lineHeight: 1,
  },
  stripLabel: {
    fontSize: "12px",
    color: "#7A7670",
    fontWeight: 400,
  },

  // Filters
  filtersRow: {
    display: "flex",
    gap: "12px",
    marginBottom: "16px",
    flexWrap: "wrap",
  },
  searchWrap: {
    position: "relative",
    flex: "1 1 280px",
  },
  searchInput: {
    width: "100%",
    background: NM,
    border: "none",
    borderRadius: "10px",
    padding: "10px 40px",
    fontSize: "13px",
    color: "#1A1A18",
    fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
    outline: "none",
    boxSizing: "border-box",
    boxShadow: NM_I_SM,
  },
  clearBtn: {
    position: "absolute",
    right: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    color: "#A8A49C",
    cursor: "pointer",
    fontSize: "12px",
    padding: 0,
  },
  select: {
    background: NM,
    border: "none",
    borderRadius: "10px",
    padding: "10px 14px",
    fontSize: "13px",
    color: "#4A4845",
    fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
    outline: "none",
    cursor: "pointer",
    minWidth: "160px",
    boxShadow: NM_S,
  },

  // Table
  tableWrap: {
    background: NM,
    borderRadius: "14px",
    overflow: "visible",
    boxShadow: NM_U,
  },
  table: {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: 0,
  },
  th: {
    padding: "12px 16px",
    fontSize: "10px",
    fontWeight: 600,
    color: "#8A8680",
    letterSpacing: "1px",
    textTransform: "uppercase",
    textAlign: "left",
    borderBottom: "1px solid #D0CAC0",
    background: "rgba(196,191,184,0.18)",
    whiteSpace: "nowrap",
  },
  tr: {
    borderBottom: "1px solid rgba(196,191,184,0.3)",
    transition: "background 0.1s",
  },
  td: {
    padding: "14px 16px",
    fontSize: "13px",
    verticalAlign: "middle",
  },

  // Cell contents
  kioskNameCell: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  kioskDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    flexShrink: 0,
  },
  kioskNameBtn: {
    background: "none",
    border: "none",
    color: "#1A1A18",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
    padding: 0,
    textAlign: "left",
    display: "block",
    marginBottom: "2px",
    textDecoration: "none",
  },
  kioskId: {
    fontFamily: "monospace",
    fontSize: "10px",
    color: "#A8A49C",
    margin: 0,
  },
  regionChip: {
    fontSize: "12px",
    color: "#4A4845",
    background: "rgba(196,191,184,0.35)",
    borderRadius: "4px",
    padding: "3px 8px",
  },
  playlistText: {
    fontSize: "13px",
    color: "#5A5651",
  },
  heartbeatText: {
    fontFamily: "monospace",
    fontSize: "12px",
  },
  ipText: {
    fontFamily: "monospace",
    fontSize: "12px",
    color: "#8A8680",
  },
  actionsCell: {
    display: "flex",
    gap: "6px",
    alignItems: "center",
  },

  // Badges
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    borderRadius: "20px",
    padding: "4px 10px",
    fontSize: "11px",
    fontWeight: 500,
    whiteSpace: "nowrap",
  },
  badgeDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    flexShrink: 0,
  },

  // Buttons
  btnGhost: {
    display: "inline-flex",
    alignItems: "center",
    background: NM,
    border: "none",
    borderRadius: "8px",
    padding: "5px 10px",
    fontSize: "12px",
    color: "#5A5651",
    cursor: "pointer",
    fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
    whiteSpace: "nowrap",
    transition: "box-shadow 0.18s",
    boxShadow: NM_S,
  },
  btnPrimary: {
    display: "inline-flex",
    alignItems: "center",
    background: NM,
    border: "none",
    borderRadius: "8px",
    padding: "5px 10px",
    fontSize: "12px",
    color: "#2D6A4F",
    cursor: "pointer",
    fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
    whiteSpace: "nowrap",
    transition: "box-shadow 0.18s",
    boxShadow: NM_S,
  },
  btnDanger: {
    display: "inline-flex",
    alignItems: "center",
    background: NM,
    border: "none",
    borderRadius: "8px",
    padding: "5px 10px",
    fontSize: "12px",
    color: "#C0392B",
    cursor: "pointer",
    fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
    whiteSpace: "nowrap",
    transition: "box-shadow 0.18s",
    boxShadow: NM_S,
  },

  // Empty & loading
  loadingWrap: { padding: "12px" },
  skeletonRow: {
    height: "52px",
    borderRadius: "8px",
    marginBottom: "8px",
    background: "linear-gradient(90deg, #D8D4CF 25%, #E8E4DF 50%, #D8D4CF 75%)",
    backgroundSize: "600px 100%",
    animation: "shimmer 1.4s infinite",
  },
  empty: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "64px 20px",
    gap: "12px",
  },
  emptyIcon: { fontSize: "40px", color: "#D0CCCA" },
  emptyText: { fontSize: "14px", color: "#8A8680", margin: 0 },
  emptyReset: {
    background: NM,
    border: "none",
    borderRadius: "8px",
    padding: "7px 16px",
    fontSize: "12px",
    color: "#7A7670",
    cursor: "pointer",
    fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
    marginTop: "4px",
    boxShadow: NM_S,
  },

  statusMenu: {
    position: "absolute",
    top: "100%",
    right: 0,
    marginTop: "6px",
    background: NM,
    border: "none",
    borderRadius: "12px",
    boxShadow: NM_U,
    zIndex: 100,
    minWidth: "160px",
    padding: "6px 0",
    overflow: "hidden",
  },
  statusMenuItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    width: "100%",
    padding: "8px 14px",
    border: "none",
    background: "transparent",
    fontSize: "12px",
    color: "#4A4845",
    cursor: "pointer",
    fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
    textAlign: "left",
    transition: "background 0.1s",
  },
  menuDot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    flexShrink: 0,
  },
}
