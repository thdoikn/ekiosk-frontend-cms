import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { useAuthStore } from "../../store/authStore"
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import client from "../../api/client"

// ── API calls ──────────────────────────────────────────────
const fetchSummary = () => client.get("/kiosks/summary/").then(r => r.data)
const fetchKiosks  = () => client.get("/kiosks/").then(r => r.data)
const forceUpdate  = (id) => client.post(`/kiosks/${id}/force-update/`)

// ── Helpers ────────────────────────────────────────────────
const STATUS_CONFIG = {
  operational:  { label: "Operational",  bg: "#E8F4EC", text: "#2D6A4F", dot: "#418840"  },
  stale:        { label: "Stale",        bg: "#FEF5E7", text: "#9B7228", dot: "#C49A3C"  },
  maintenance:  { label: "Maintenance",  bg: "#E3F2FD", text: "#1565C0", dot: "#1976D2"  },
  out_of_order: { label: "Out of Order", bg: "#FDECEA", text: "#C0392B", dot: "#D83A2F"  },
  disconnected: { label: "Disconnected", bg: "#F3F2F0", text: "#6A6860", dot: "#9A9890"  },
  pending:      { label: "Pending",      bg: "#FAFAFA", text: "#9E9E9E", dot: "#BDBDBD"  },
}

function timeSince(dateStr) {
  if (!dateStr) return "Never"
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (diff < 60)   return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function formatBytes(bytes) {
  if (!bytes) return "—"
  if (bytes > 1e9) return `${(bytes / 1e9).toFixed(1)} GB`
  return `${(bytes / 1e6).toFixed(0)} MB`
}

// ── Map helpers ─────────────────────────────────────────────
function hasValidCoords(k) {
  const lat = parseFloat(k.latitude)
  const lng = parseFloat(k.longitude)
  return k.latitude != null && k.longitude != null && (lat !== 0 || lng !== 0)
}

function FitBounds({ kiosks }) {
  const map = useMap()
  useEffect(() => {
    const points = kiosks.filter(hasValidCoords)
    if (points.length === 0) return
    if (points.length === 1) {
      map.setView([parseFloat(points[0].latitude), parseFloat(points[0].longitude)], 13)
      return
    }
    const lats = points.map(k => parseFloat(k.latitude))
    const lngs = points.map(k => parseFloat(k.longitude))
    map.fitBounds(
      [[Math.min(...lats), Math.min(...lngs)], [Math.max(...lats), Math.max(...lngs)]],
      { padding: [40, 40] }
    )
  }, [kiosks, map])
  return null
}

function InvalidateMapSize({ trigger }) {
  const map = useMap()
  useEffect(() => {
    const id = setTimeout(() => map.invalidateSize(), 120)
    return () => clearTimeout(id)
  }, [map, trigger])
  return null
}

// ── Sub-components ─────────────────────────────────────────
function StatCard({ label, value, color, icon }) {
  return (
    <div style={{ ...styles.statCard, borderTopColor: color }}>
      <div style={styles.statTop}>
        <span style={styles.statIcon}>{icon}</span>
        <span style={{ ...styles.statValue, color }}>{value}</span>
      </div>
      <span style={styles.statLabel}>{label}</span>
    </div>
  )
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending
  return (
    <span style={{ ...styles.badge, background: cfg.bg, color: cfg.text }}>
      <span style={{ ...styles.badgeDot, background: cfg.dot }} />
      {cfg.label}
    </span>
  )
}

function KioskMap({ kiosks }) {
  const [activeStatus, setActiveStatus] = useState("all")
  const [expanded, setExpanded] = useState(false)

  const mapped = kiosks.filter(hasValidCoords)
  const filtered = activeStatus === "all" ? mapped : mapped.filter(k => k.status === activeStatus)

  const IKN_CENTER = [-0.787281, 116.680908]
  const defaultCenter = mapped.length > 0
    ? [parseFloat(mapped[0].latitude), parseFloat(mapped[0].longitude)]
    : IKN_CENTER

  const mapContent = (isExpanded = false) => (
    <MapContainer
      center={defaultCenter}
      zoom={mapped.length === 0 ? 12 : 10}
      style={{ width: "100%", height: "100%", borderRadius: isExpanded ? "0 0 16px 16px" : "0 0 10px 10px" }}
      zoomControl={true}
    >
      <InvalidateMapSize trigger={isExpanded} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {mapped.length > 0 && <FitBounds kiosks={mapped} />}
      {filtered.map(kiosk => {
        const cfg = STATUS_CONFIG[kiosk.status] || STATUS_CONFIG.pending
        return (
          <CircleMarker
            key={kiosk.id}
            center={[parseFloat(kiosk.latitude), parseFloat(kiosk.longitude)]}
            radius={10}
            pathOptions={{
              color: cfg.dot,
              fillColor: cfg.dot,
              fillOpacity: 0.85,
              weight: 2,
            }}
          >
            <Popup>
              <div style={styles.popupContent}>
                <div style={styles.popupHeader}>
                  <span style={{ ...styles.popupDot, background: cfg.dot }} />
                  <strong style={styles.popupName}>{kiosk.name}</strong>
                </div>
                <div style={styles.popupGrid}>
                  <span style={styles.popupKey}>Status</span>
                  <span style={{ ...styles.popupVal, color: cfg.dot }}>{cfg.label}</span>
                  <span style={styles.popupKey}>Region</span>
                  <span style={styles.popupVal}>{kiosk.region?.name ?? "—"}</span>
                  <span style={styles.popupKey}>Last Heartbeat</span>
                  <span style={styles.popupVal}>{timeSince(kiosk.last_heartbeat)}</span>
                  <span style={styles.popupKey}>IP Address</span>
                  <span style={styles.popupVal}>{kiosk.last_ip_address ?? "—"}</span>
                  <span style={styles.popupKey}>Playlist</span>
                  <span style={styles.popupVal}>{kiosk.active_playlist?.name ?? "None"}</span>
                  <span style={styles.popupKey}>Storage Free</span>
                  <span style={styles.popupVal}>{formatBytes(kiosk.last_storage_free)}</span>
                  <span style={styles.popupKey}>Coordinates</span>
                  <span style={styles.popupVal}>{parseFloat(kiosk.latitude).toFixed(5)}, {parseFloat(kiosk.longitude).toFixed(5)}</span>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        )
      })}
      {mapped.length === 0 && (
        <div style={styles.mapNoCoords}>
          Belum ada kiosk dengan koordinat GPS
        </div>
      )}
    </MapContainer>
  )

  const mapHeader = (isExpanded = false) => (
    <div style={styles.mapHeader}>
        <div>
          <h2 style={styles.mapTitle}>Peta Sebaran Kiosk</h2>
          <p style={styles.mapSubtitle}>
            {mapped.length} dari {kiosks.length} kiosk memiliki koordinat
          </p>
        </div>
        <div style={styles.mapControls}>
          <div style={styles.mapLegend}>
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => setActiveStatus(activeStatus === key ? "all" : key)}
                style={{
                  ...styles.legendItem,
                  opacity: activeStatus !== "all" && activeStatus !== key ? 0.4 : 1,
                  background: activeStatus === key ? cfg.bg : "transparent",
                  borderColor: activeStatus === key ? cfg.dot : "#E0DAD0",
                }}
              >
                <span style={{ ...styles.legendDot, background: cfg.dot }} />
                <span style={{ ...styles.legendLabel, color: activeStatus === key ? cfg.text : "#7A7670" }}>{cfg.label}</span>
              </button>
            ))}
          </div>
          <button
            onClick={() => setExpanded(!isExpanded)}
            style={styles.mapExpandBtn}
            onMouseEnter={e => Object.assign(e.currentTarget.style, styles.mapExpandBtnHover)}
            onMouseLeave={e => Object.assign(e.currentTarget.style, styles.mapExpandBtn)}
          >
            {isExpanded ? <CloseIcon /> : <ExpandIcon />}
            <span>{isExpanded ? "Tutup" : "Perbesar"}</span>
          </button>
        </div>
      </div>
  )

  return (
    <div style={styles.mapSection}>
      {mapHeader()}

      <div style={styles.mapWrapper}>
        {mapContent()}
      </div>

      {expanded && (
        <div style={styles.mapOverlay}>
          <div style={styles.mapOverlayCard}>
            {mapHeader(true)}
            <div style={styles.mapOverlayWrapper}>
              {mapContent(true)}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function KioskCard({ kiosk, onForceUpdate, isForcing, navigate, isPublic }) {
  const cfg = STATUS_CONFIG[kiosk.status] || STATUS_CONFIG.pending
  return (
    <div
      style={styles.kioskCard}
      onClick={() => navigate(`/kiosks/${kiosk.id}`)}
      onMouseEnter={e => Object.assign(e.currentTarget.style, styles.kioskCardHover)}
      onMouseLeave={e => Object.assign(e.currentTarget.style, styles.kioskCard)}
    >
      <div style={{ ...styles.kioskCardAccent, background: cfg.dot }} />
      <div style={styles.kioskCardInner}>
        <div style={styles.kioskCardHeader}>
          <div>
            <p style={styles.kioskName}>{kiosk.name}</p>
            <p style={styles.kioskRegion}>{kiosk.region?.name ?? "No Region"}</p>
          </div>
          <StatusBadge status={kiosk.status} />
        </div>

        <div style={styles.kioskMeta}>
          <div style={styles.kioskMetaItem}>
            <span style={styles.kioskMetaLabel}>Last Heartbeat</span>
            <span style={styles.kioskMetaValue}>{timeSince(kiosk.last_heartbeat)}</span>
          </div>
          <div style={styles.kioskMetaItem}>
            <span style={styles.kioskMetaLabel}>IP Address</span>
            <span style={styles.kioskMetaValue}>{kiosk.last_ip_address ?? "—"}</span>
          </div>
          <div style={styles.kioskMetaItem}>
            <span style={styles.kioskMetaLabel}>Storage Free</span>
            <span style={styles.kioskMetaValue}>{formatBytes(kiosk.last_storage_free)}</span>
          </div>
          <div style={styles.kioskMetaItem}>
            <span style={styles.kioskMetaLabel}>App Version</span>
            <span style={styles.kioskMetaValue}>{kiosk.last_app_version || "—"}</span>
          </div>
        </div>

        <div style={styles.kioskCardFooter}>
          <div style={styles.playlistChip}>
            <span style={styles.playlistChipDot} />
            <span style={styles.playlistChipText}>
              {kiosk.active_playlist?.name ?? "No Playlist"}
            </span>
          </div>
          {!isPublic && kiosk.status !== "pending" && (
            <button
              onClick={(e) => { e.stopPropagation(); onForceUpdate(kiosk.id) }}
              disabled={isForcing}
              style={isForcing ? { ...styles.forceBtn, opacity: 0.5 } : styles.forceBtn}
              onMouseEnter={e => { e.stopPropagation(); Object.assign(e.currentTarget.style, styles.forceBtnHover) }}
              onMouseLeave={e => { e.stopPropagation(); Object.assign(e.currentTarget.style, styles.forceBtn) }}
            >
              {isForcing ? "Sending…" : "Force Update"}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────
export default function DashboardPage() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const isPublic = !user?.is_staff
  const [forcingId, setForcingId] = useState(null)
  const [filter, setFilter] = useState("all")
  const [view, setView] = useState("grid") // "grid" | "map"

  const { data: summary, isLoading: sumLoading } = useQuery({
    queryKey: ["summary"],
    queryFn: fetchSummary,
    refetchInterval: 30000,
  })

  const { data: kioskData, isLoading: kioskLoading } = useQuery({
    queryKey: ["kiosks"],
    queryFn: fetchKiosks,
    refetchInterval: 30000,
  })

  const mutation = useMutation({
    mutationFn: forceUpdate,
    onMutate: (id) => setForcingId(id),
    onSettled: () => {
      setForcingId(null)
      qc.invalidateQueries(["kiosks"])
    },
  })

  const kiosks = useMemo(() =>
    [...(kioskData?.results ?? kioskData ?? [])].sort((a, b) => {
      if (!a.last_heartbeat && !b.last_heartbeat) return 0
      if (!a.last_heartbeat) return 1
      if (!b.last_heartbeat) return -1
      return new Date(b.last_heartbeat) - new Date(a.last_heartbeat)
    }),
    [kioskData]
  )
  const filtered = filter === "all" ? kiosks : kiosks.filter(k => k.status === filter)

  return (
    <div style={styles.page}>
      {/* Page header */}
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Dashboard</h1>
          <p style={styles.pageSubtitle}>Monitoring dan kontrol semua eKiosk IKN</p>
        </div>
        <div style={styles.headerRight}>
          {/* View toggle — prominent segmented control */}
          <div style={styles.viewSegment}>
            {[
              { key: "grid", icon: <GridIcon />,   label: "Daftar Kiosk" },
              { key: "map",  icon: <MapPinIcon />, label: "Peta Sebaran" },
            ].map(({ key, icon, label }) => (
              <button
                key={key}
                onClick={() => setView(key)}
                style={view === key ? { ...styles.viewSegBtn, ...styles.viewSegBtnActive } : styles.viewSegBtn}
              >
                {icon}
                <span>{label}</span>
              </button>
            ))}
          </div>
          <div style={styles.refreshNote}>
            <span style={styles.refreshDot} />
            <span style={styles.refreshText}>Refresh 30 detik</span>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div style={styles.statsGrid}>
        {sumLoading ? (
          <div style={styles.loadingRow}>
            <span style={styles.skeletonCard} />
            <span style={styles.skeletonCard} />
            <span style={styles.skeletonCard} />
            <span style={styles.skeletonCard} />
          </div>
        ) : (
          <>
            <StatCard label="Total Kiosks"      value={summary?.total         ?? 0} color="#C49A3C" icon="▦" />
            <StatCard label="Operational"        value={summary?.operational   ?? 0} color="#418840" icon="●" />
            <StatCard label="Disconnected"       value={summary?.disconnected  ?? 0} color="#9A9890" icon="●" />
            <StatCard label="Issues"             value={(summary?.maintenance ?? 0) + (summary?.out_of_order ?? 0) + (summary?.stale ?? 0)} color="#D83A2F" icon="◐" />
          </>
        )}
      </div>

      {/* Map view */}
      {view === "map" && !kioskLoading && (
        <KioskMap kiosks={kiosks} />
      )}

      {/* Grid view */}
      {view === "grid" && (
        <>
          {/* Filter tabs */}
          <div style={styles.filterRow}>
            {[
              { key: "all",          label: "Semua" },
              { key: "operational",  label: "Operational" },
              { key: "stale",        label: "Konten Usang" },
              { key: "maintenance",  label: "Pemeliharaan" },
              { key: "out_of_order", label: "Rusak" },
              { key: "disconnected", label: "Terputus" },
              { key: "pending",      label: "Belum Terhubung" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                style={filter === key ? { ...styles.filterTab, ...styles.filterTabActive } : styles.filterTab}
              >
                {label}
                {key !== "all" && summary?.[key] !== undefined && (
                  <span style={filter === key ? { ...styles.filterCount, ...styles.filterCountActive } : styles.filterCount}>
                    {summary[key]}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Kiosk grid */}
          {kioskLoading ? (
            <div style={styles.kioskGrid}>
              {[...Array(6)].map((_, i) => (
                <div key={i} style={styles.kioskSkeleton} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div style={styles.emptyState}>
              <span style={styles.emptyIcon}>◫</span>
              <p style={styles.emptyText}>Tidak ada kiosk dengan status ini</p>
            </div>
          ) : (
            <div style={styles.kioskGrid}>
              {filtered.map(kiosk => (
                <KioskCard
                  key={kiosk.id}
                  kiosk={kiosk}
                  onForceUpdate={(id) => mutation.mutate(id)}
                  isForcing={forcingId === kiosk.id}
                  navigate={navigate}
                  isPublic={isPublic}
                />
              ))}
            </div>
          )}
        </>
      )}

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes shimmer {
          0% { background-position: -400px 0 }
          100% { background-position: 400px 0 }
        }
        .leaflet-container {
          font-family: 'Inter', 'Plus Jakarta Sans', sans-serif;
        }
        .leaflet-popup-content-wrapper {
          background: #FFFFFF !important;
          border: 1px solid #E5E0D8 !important;
          border-radius: 10px !important;
          box-shadow: 0 8px 24px rgba(0,0,0,0.1) !important;
          color: #1A1A18 !important;
          padding: 0 !important;
        }
        .leaflet-popup-tip {
          background: #FFFFFF !important;
        }
        .leaflet-popup-content {
          margin: 0 !important;
        }
        .leaflet-control-zoom a {
          background: #FFFFFF !important;
          border-color: #E5E0D8 !important;
          color: #7A7670 !important;
        }
        .leaflet-control-zoom a:hover {
          background: #F5F1EA !important;
          color: #1A1A18 !important;
        }
        .leaflet-control-attribution {
          background: rgba(255,255,255,0.8) !important;
          color: #8A8680 !important;
          font-size: 10px !important;
        }
        .leaflet-control-attribution a { color: #7A7670 !important; }
      `}</style>
    </div>
  )
}

// ── Icon components ─────────────────────────────────────────
function GridIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
    </svg>
  )
}
function MapPinIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  )
}
function ExpandIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 3 21 3 21 9" />
      <polyline points="9 21 3 21 3 15" />
      <line x1="21" y1="3" x2="14" y2="10" />
      <line x1="3" y1="21" x2="10" y2="14" />
    </svg>
  )
}
function CloseIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

// ── Neumorphic tokens ───────────────────────────────────────
const NM   = "#EDEAE6"
const NM_U = "6px 6px 14px #D0CCCA, -6px -6px 14px #FFFFFF"
const NM_S = "4px 4px 10px #D0CCCA, -4px -4px 10px #FFFFFF"
const NM_I = "inset 4px 4px 10px #D0CCCA, inset -4px -4px 10px #FFFFFF"
const NM_I_SM = "inset 3px 3px 7px #D0CCCA, inset -3px -3px 7px #FFFFFF"

// ── Styles ─────────────────────────────────────────────────
const styles = {
  page: {
    fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
    color: "#2A2520",
    width: "100%",
  },
  pageHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: "28px",
  },
  pageTitle: {
    fontSize: "26px",
    fontWeight: 700,
    color: "#2A2520",
    margin: "0 0 3px",
    letterSpacing: "0.3px",
  },
  pageSubtitle: {
    fontSize: "13px",
    color: "#9A9590",
    margin: 0,
    fontWeight: 400,
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  // View segment control — prominent, labeled
  viewSegment: {
    display: "flex",
    background: NM,
    boxShadow: NM_I,
    borderRadius: "14px",
    padding: "4px",
    gap: "4px",
  },
  viewSegBtn: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    background: NM,
    border: "none",
    borderRadius: "10px",
    padding: "8px 16px",
    fontSize: "12px",
    fontWeight: 500,
    color: "#9A9590",
    cursor: "pointer",
    fontFamily: "'Inter', sans-serif",
    transition: "all 0.2s",
    boxShadow: "none",
  },
  viewSegBtnActive: {
    background: NM,
    color: "#2D6A4F",
    fontWeight: 700,
    boxShadow: NM_S,
  },

  refreshNote: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    background: NM,
    boxShadow: NM_I_SM,
    borderRadius: "20px",
    padding: "7px 14px",
  },
  refreshDot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    background: "#418840",
    animation: "pulse 2s ease infinite",
    display: "inline-block",
    boxShadow: "0 0 5px rgba(65,136,64,0.5)",
  },
  refreshText: {
    fontSize: "11px",
    color: "#9A9590",
    fontWeight: 500,
  },

  // Stats
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "16px",
    marginBottom: "24px",
  },
  statCard: {
    background: NM,
    borderRadius: "16px",
    padding: "22px 24px",
    boxShadow: NM_U,
    position: "relative",
    overflow: "hidden",
  },
  statTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "12px",
  },
  statIcon: {
    fontSize: "20px",
    color: "#C0BAB0",
  },
  statValue: {
    fontSize: "38px",
    fontWeight: 700,
    lineHeight: 1,
  },
  statLabel: {
    fontSize: "11px",
    color: "#9A9590",
    letterSpacing: "1px",
    textTransform: "uppercase",
    fontWeight: 600,
  },
  loadingRow: {
    display: "contents",
  },
  skeletonCard: {
    display: "block",
    height: "100px",
    borderRadius: "16px",
    background: NM,
    boxShadow: NM_U,
    animation: "shimmer 1.5s infinite",
  },

  // Map
  mapSection: {
    background: NM,
    borderRadius: "16px",
    overflow: "hidden",
    marginBottom: "24px",
    boxShadow: NM_U,
  },
  mapHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 20px",
    borderBottom: "1px solid rgba(196,191,184,0.4)",
    flexWrap: "wrap",
    gap: "12px",
  },
  mapTitle: {
    fontSize: "14px",
    fontWeight: 700,
    color: "#2A2520",
    margin: "0 0 2px",
  },
  mapSubtitle: {
    fontSize: "12px",
    color: "#9A9590",
    margin: 0,
  },
  mapLegend: {
    display: "flex",
    gap: "6px",
    flexWrap: "wrap",
  },
  mapControls: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: "10px",
    flexWrap: "wrap",
  },
  mapExpandBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    background: NM,
    border: "none",
    borderRadius: "20px",
    padding: "7px 13px",
    color: "#2D6A4F",
    cursor: "pointer",
    fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
    fontSize: "11px",
    fontWeight: 700,
    boxShadow: NM_S,
    transition: "all 0.18s",
  },
  mapExpandBtnHover: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    background: NM,
    border: "none",
    borderRadius: "20px",
    padding: "7px 13px",
    color: "#1A4A33",
    cursor: "pointer",
    fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
    fontSize: "11px",
    fontWeight: 700,
    boxShadow: NM_I_SM,
    transition: "all 0.18s",
  },
  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    background: NM,
    border: "none",
    borderRadius: "20px",
    padding: "5px 12px",
    cursor: "pointer",
    transition: "all 0.18s",
    boxShadow: NM_S,
  },
  legendDot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    flexShrink: 0,
  },
  legendLabel: {
    fontSize: "11px",
    whiteSpace: "nowrap",
    color: "#7A7670",
    fontWeight: 500,
  },
  mapWrapper: {
    height: "clamp(520px, calc(100vh - 330px), 760px)",
    position: "relative",
  },
  mapOverlay: {
    position: "fixed",
    inset: 0,
    zIndex: 2000,
    padding: "28px",
    background: "rgba(42,37,32,0.38)",
    backdropFilter: "blur(8px)",
    display: "flex",
  },
  mapOverlayCard: {
    width: "100%",
    height: "100%",
    background: NM,
    borderRadius: "18px",
    overflow: "hidden",
    boxShadow: "10px 10px 28px rgba(42,37,32,0.28), -6px -6px 18px rgba(255,255,255,0.35)",
    display: "flex",
    flexDirection: "column",
  },
  mapOverlayWrapper: {
    flex: 1,
    minHeight: 0,
    position: "relative",
  },
  mapNoCoords: {
    position: "absolute",
    bottom: "12px",
    left: "50%",
    transform: "translateX(-50%)",
    background: "rgba(255,255,255,0.92)",
    border: "1px solid #E5E0D8",
    borderRadius: "20px",
    padding: "6px 14px",
    fontSize: "12px",
    color: "#8A8680",
    zIndex: 1000,
    pointerEvents: "none",
    whiteSpace: "nowrap",
  },
  mapEmpty: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
  },

  // Popup
  popupContent: {
    padding: "14px 16px",
    minWidth: "220px",
  },
  popupHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "10px",
    paddingBottom: "10px",
    borderBottom: "1px solid rgba(196,191,184,0.4)",
  },
  popupDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    flexShrink: 0,
  },
  popupName: {
    fontSize: "14px",
    fontWeight: 600,
    color: "#2A2520",
  },
  popupGrid: {
    display: "grid",
    gridTemplateColumns: "auto 1fr",
    gap: "5px 12px",
    alignItems: "center",
  },
  popupKey: {
    fontSize: "11px",
    color: "#9A9590",
    whiteSpace: "nowrap",
  },
  popupVal: {
    fontSize: "12px",
    color: "#4A4845",
    fontWeight: 500,
  },

  // Filter tabs
  filterRow: {
    display: "flex",
    gap: "8px",
    marginBottom: "20px",
    flexWrap: "wrap",
  },
  filterTab: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: NM,
    border: "none",
    borderRadius: "20px",
    padding: "8px 18px",
    fontSize: "12px",
    fontWeight: 500,
    color: "#7A7670",
    cursor: "pointer",
    fontFamily: "'Inter', sans-serif",
    transition: "all 0.18s",
    boxShadow: NM_S,
  },
  filterTabActive: {
    boxShadow: NM_I,
    color: "#2D6A4F",
    fontWeight: 700,
  },
  filterCount: {
    background: "rgba(196,191,184,0.3)",
    borderRadius: "10px",
    padding: "1px 7px",
    fontSize: "10px",
    color: "#9A9590",
    fontWeight: 600,
  },
  filterCountActive: {
    background: "rgba(45,106,79,0.15)",
    color: "#2D6A4F",
  },

  // Kiosk grid
  kioskGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "18px",
  },
  kioskSkeleton: {
    height: "200px",
    borderRadius: "16px",
    background: NM,
    boxShadow: NM_U,
    animation: "shimmer 1.5s infinite",
  },
  kioskCard: {
    background: NM,
    borderRadius: "16px",
    overflow: "hidden",
    position: "relative",
    transition: "box-shadow 0.2s, transform 0.18s",
    cursor: "pointer",
    boxShadow: NM_S,
  },
  kioskCardHover: {
    background: NM,
    borderRadius: "16px",
    overflow: "hidden",
    position: "relative",
    transition: "box-shadow 0.2s, transform 0.18s",
    cursor: "pointer",
    boxShadow: NM_U,
    transform: "translateY(-2px)",
  },
  kioskCardAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "3px",
    borderRadius: "16px 16px 0 0",
  },
  kioskCardInner: {
    padding: "20px",
  },
  kioskCardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "16px",
  },
  kioskName: {
    fontSize: "14px",
    fontWeight: 700,
    color: "#2A2520",
    margin: "0 0 3px",
  },
  kioskRegion: {
    fontSize: "12px",
    color: "#9A9590",
    margin: 0,
  },

  // Badge
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    borderRadius: "20px",
    padding: "4px 10px",
    fontSize: "11px",
    fontWeight: 600,
    letterSpacing: "0.2px",
    whiteSpace: "nowrap",
  },
  badgeDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    flexShrink: 0,
  },

  // Kiosk meta grid
  kioskMeta: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
    marginBottom: "16px",
    background: NM,
    borderRadius: "12px",
    padding: "12px",
    boxShadow: NM_I_SM,
  },
  kioskMetaItem: {
    display: "flex",
    flexDirection: "column",
    gap: "3px",
  },
  kioskMetaLabel: {
    fontSize: "9px",
    color: "#B0AAA2",
    textTransform: "uppercase",
    letterSpacing: "0.8px",
    fontWeight: 700,
  },
  kioskMetaValue: {
    fontSize: "12px",
    color: "#4A4845",
    fontWeight: 500,
  },

  // Footer
  kioskCardFooter: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  playlistChip: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  playlistChipDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "#2D6A4F",
    flexShrink: 0,
    boxShadow: "0 0 4px rgba(45,106,79,0.5)",
  },
  playlistChipText: {
    fontSize: "11px",
    color: "#9A9590",
    fontWeight: 500,
  },
  forceBtn: {
    background: NM,
    border: "none",
    borderRadius: "8px",
    padding: "6px 12px",
    fontSize: "11px",
    fontWeight: 600,
    color: "#7A7670",
    cursor: "pointer",
    fontFamily: "'Inter', sans-serif",
    boxShadow: NM_S,
    transition: "all 0.18s",
  },
  forceBtnHover: {
    background: NM,
    border: "none",
    borderRadius: "8px",
    padding: "6px 12px",
    fontSize: "11px",
    fontWeight: 600,
    color: "#C0392B",
    cursor: "pointer",
    fontFamily: "'Inter', sans-serif",
    boxShadow: NM_I_SM,
    transition: "all 0.18s",
  },

  // Empty state
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "80px 20px",
    gap: "12px",
  },
  emptyIcon: {
    fontSize: "48px",
    color: "#D0CCCA",
  },
  emptyText: {
    fontSize: "14px",
    color: "#9A9590",
    margin: 0,
  },
}
