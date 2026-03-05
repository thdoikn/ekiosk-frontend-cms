import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import client from "../../api/client"

// ── API ────────────────────────────────────────────────────
const fetchKiosks  = () => client.get("/kiosks/").then(r => r.data)
const fetchRegions = () => client.get("/regions/").then(r => r.data)
const doForceUpdate = (id) => client.post(`/kiosks/${id}/force-update/`)
const doToggleActive = ({ id, is_active }) => client.patch(`/kiosks/${id}/`, { is_active })

// ── Helpers ────────────────────────────────────────────────
const STATUS_CFG = {
  online:          { label: "Online",          bg: "#1a3322", text: "#86ac69", dot: "#418840" },
  offline:         { label: "Offline",         bg: "#2e1a1a", text: "#f2767c", dot: "#d83a2f" },
  stale:           { label: "Stale",           bg: "#2e2510", text: "#dbaf6c", dot: "#b98e52" },
  never_connected: { label: "Never Connected", bg: "#222220", text: "#808180", dot: "#5a5956" },
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
  const cfg = STATUS_CFG[status] || STATUS_CFG.never_connected
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
      onMouseEnter={e => !disabled && (e.currentTarget.style.opacity = "0.8")}
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

  const toggleMut = useMutation({
    mutationFn: doToggleActive,
    onSettled: () => qc.invalidateQueries(["kiosks"]),
  })

  const kiosks  = kioskData?.results ?? kioskData ?? []
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
            style={{
              ...S.stripItem,
              borderColor: statusFilter === key ? cfg.dot : "transparent",
              background: statusFilter === key ? `${cfg.bg}` : "rgba(255,255,255,0.02)",
            }}
          >
            <span style={{ ...S.stripDot, background: cfg.dot }} />
            <span style={{ ...S.stripCount, color: cfg.text }}>{counts[key] ?? 0}</span>
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
                {["Nama Kiosk", "Region", "Status", "Playlist Aktif", "Heartbeat Terakhir", "IP Address", "Aksi"].map(h => (
                  <th key={h} style={S.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((kiosk, i) => (
                <tr
                  key={kiosk.id}
                  style={{ ...S.tr, animationDelay: `${i * 0.04}s` }}
                  onMouseEnter={e => e.currentTarget.style.background = "#2a2a26"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <td style={S.td}>
                    <div style={S.kioskNameCell}>
                      <div style={{
                        ...S.kioskDot,
                        background: STATUS_CFG[kiosk.status]?.dot ?? "#5a5956"
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
                      {kiosk.region?.name ?? <span style={{ color: "#5a5956" }}>—</span>}
                    </span>
                  </td>
                  <td style={S.td}>
                    <StatusBadge status={kiosk.status} />
                  </td>
                  <td style={S.td}>
                    <span style={S.playlistText}>
                      {kiosk.active_playlist?.name ?? <span style={{ color: "#5a5956" }}>Tidak ada</span>}
                    </span>
                  </td>
                  <td style={S.td}>
                    <span style={{
                      ...S.heartbeatText,
                      color: kiosk.status === "offline" ? "#f2767c" : "#808180"
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
                        disabled={forcingId === kiosk.id || kiosk.status === "never_connected"}
                        variant="ghost"
                      >
                        {forcingId === kiosk.id ? "…" : <><RefreshIcon /> Update</>}
                      </ActionBtn>
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
    <svg style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#5a5956" }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  )
}
function DetailIcon()  { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight:4}}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> }
function RefreshIcon() { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight:4}}><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg> }

// ── Styles ─────────────────────────────────────────────────
const ANIM_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600&family=DM+Mono:wght@400&family=DM+Sans:wght@300;400;500;600&display=swap');
  @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes shimmer { 0%{background-position:-600px 0} 100%{background-position:600px 0} }
`

const S = {
  page: {
    fontFamily: "'DM Sans', sans-serif",
    color: "#fff9eb",
    maxWidth: "1400px",
    animation: "fadeUp 0.4s ease both",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "24px",
  },
  pageTitle: {
    fontFamily: "'Cinzel', serif",
    fontSize: "26px",
    fontWeight: 600,
    color: "#fff9eb",
    margin: "0 0 4px",
    letterSpacing: "1px",
  },
  pageSub: {
    fontSize: "13px",
    color: "#808180",
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
    borderRadius: "8px",
    border: "1px solid",
    cursor: "pointer",
    background: "rgba(255,255,255,0.02)",
    transition: "all 0.15s",
    fontFamily: "'DM Sans', sans-serif",
  },
  stripDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    flexShrink: 0,
  },
  stripCount: {
    fontFamily: "'Cinzel', serif",
    fontSize: "20px",
    fontWeight: 600,
    lineHeight: 1,
  },
  stripLabel: {
    fontSize: "12px",
    color: "#808180",
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
    background: "#1e1e1c",
    border: "1px solid #3a3a36",
    borderRadius: "8px",
    padding: "10px 40px",
    fontSize: "13px",
    color: "#fff9eb",
    fontFamily: "'DM Sans', sans-serif",
    outline: "none",
    boxSizing: "border-box",
  },
  clearBtn: {
    position: "absolute",
    right: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    color: "#5a5956",
    cursor: "pointer",
    fontSize: "12px",
    padding: 0,
  },
  select: {
    background: "#1e1e1c",
    border: "1px solid #3a3a36",
    borderRadius: "8px",
    padding: "10px 14px",
    fontSize: "13px",
    color: "#b2a893",
    fontFamily: "'DM Sans', sans-serif",
    outline: "none",
    cursor: "pointer",
    minWidth: "160px",
  },

  // Table
  tableWrap: {
    background: "#1e1e1c",
    border: "1px solid #2e2e2a",
    borderRadius: "12px",
    overflow: "hidden",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    padding: "12px 16px",
    fontSize: "10px",
    fontWeight: 600,
    color: "#5a5956",
    letterSpacing: "1px",
    textTransform: "uppercase",
    textAlign: "left",
    borderBottom: "1px solid #2e2e2a",
    background: "#1a1a18",
    whiteSpace: "nowrap",
  },
  tr: {
    borderBottom: "1px solid #252522",
    transition: "background 0.1s",
    animation: "fadeUp 0.3s ease both",
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
    color: "#fff9eb",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    padding: 0,
    textAlign: "left",
    display: "block",
    marginBottom: "2px",
  },
  kioskId: {
    fontFamily: "'DM Mono', monospace",
    fontSize: "10px",
    color: "#5a5956",
    margin: 0,
  },
  regionChip: {
    fontSize: "12px",
    color: "#b2a893",
    background: "#252522",
    borderRadius: "4px",
    padding: "3px 8px",
  },
  playlistText: {
    fontSize: "13px",
    color: "#919088",
  },
  heartbeatText: {
    fontFamily: "'DM Mono', monospace",
    fontSize: "12px",
  },
  ipText: {
    fontFamily: "'DM Mono', monospace",
    fontSize: "12px",
    color: "#5a5956",
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
    background: "transparent",
    border: "1px solid #2e2e2a",
    borderRadius: "6px",
    padding: "5px 10px",
    fontSize: "12px",
    color: "#808180",
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    whiteSpace: "nowrap",
    transition: "opacity 0.15s",
  },
  btnPrimary: {
    display: "inline-flex",
    alignItems: "center",
    background: "rgba(42,79,133,0.3)",
    border: "1px solid rgba(42,79,133,0.5)",
    borderRadius: "6px",
    padding: "5px 10px",
    fontSize: "12px",
    color: "#7ba3d4",
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    whiteSpace: "nowrap",
    transition: "opacity 0.15s",
  },
  btnDanger: {
    display: "inline-flex",
    alignItems: "center",
    background: "rgba(216,58,47,0.1)",
    border: "1px solid rgba(216,58,47,0.3)",
    borderRadius: "6px",
    padding: "5px 10px",
    fontSize: "12px",
    color: "#f2767c",
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    whiteSpace: "nowrap",
    transition: "opacity 0.15s",
  },

  // Empty & loading
  loadingWrap: { padding: "12px" },
  skeletonRow: {
    height: "52px",
    borderRadius: "6px",
    marginBottom: "8px",
    background: "linear-gradient(90deg, #232320 25%, #2a2a26 50%, #232320 75%)",
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
  emptyIcon: { fontSize: "40px", color: "#3a3a36" },
  emptyText: { fontSize: "14px", color: "#5a5956", margin: 0 },
  emptyReset: {
    background: "transparent",
    border: "1px solid #3a3a36",
    borderRadius: "6px",
    padding: "7px 16px",
    fontSize: "12px",
    color: "#808180",
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    marginTop: "4px",
  },
}
