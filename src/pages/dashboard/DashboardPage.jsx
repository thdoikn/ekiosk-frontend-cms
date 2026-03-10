import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState, useEffect } from "react"
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import client from "../../api/client"

// ── API calls ──────────────────────────────────────────────
const fetchSummary = () => client.get("/kiosks/summary/").then(r => r.data)
const fetchKiosks  = () => client.get("/kiosks/").then(r => r.data)
const forceUpdate  = (id) => client.post(`/kiosks/${id}/force-update/`)

// ── Helpers ────────────────────────────────────────────────
const STATUS_CONFIG = {
  online:          { label: "Online",          bg: "#1a3322", text: "#86ac69", dot: "#418840"  },
  offline:         { label: "Offline",         bg: "#2e1a1a", text: "#f2767c", dot: "#d83a2f"  },
  stale:           { label: "Stale Content",   bg: "#2e2510", text: "#dbaf6c", dot: "#b98e52"  },
  never_connected: { label: "Never Connected", bg: "#222220", text: "#808180", dot: "#5a5956"  },
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
function FitBounds({ kiosks }) {
  const map = useMap()
  useEffect(() => {
    const points = kiosks.filter(k => k.latitude != null && k.longitude != null)
    if (points.length === 0) return
    if (points.length === 1) {
      map.setView([points[0].latitude, points[0].longitude], 13)
      return
    }
    const lats = points.map(k => k.latitude)
    const lngs = points.map(k => k.longitude)
    map.fitBounds(
      [[Math.min(...lats), Math.min(...lngs)], [Math.max(...lats), Math.max(...lngs)]],
      { padding: [40, 40] }
    )
  }, [kiosks, map])
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
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.never_connected
  return (
    <span style={{ ...styles.badge, background: cfg.bg, color: cfg.text }}>
      <span style={{ ...styles.badgeDot, background: cfg.dot }} />
      {cfg.label}
    </span>
  )
}

function KioskMap({ kiosks }) {
  const [activeStatus, setActiveStatus] = useState("all")

  const mapped = kiosks.filter(k => k.latitude != null && k.longitude != null)
  const filtered = activeStatus === "all" ? mapped : mapped.filter(k => k.status === activeStatus)

  const defaultCenter = mapped.length > 0
    ? [mapped[0].latitude, mapped[0].longitude]
    : [-0.787281, 116.680908] // IKN default

  return (
    <div style={styles.mapSection}>
      <div style={styles.mapHeader}>
        <div>
          <h2 style={styles.mapTitle}>Peta Sebaran Kiosk</h2>
          <p style={styles.mapSubtitle}>
            {mapped.length} dari {kiosks.length} kiosk memiliki koordinat
          </p>
        </div>
        <div style={styles.mapLegend}>
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => setActiveStatus(activeStatus === key ? "all" : key)}
              style={{
                ...styles.legendItem,
                opacity: activeStatus !== "all" && activeStatus !== key ? 0.4 : 1,
                background: activeStatus === key ? "rgba(255,249,235,0.05)" : "transparent",
              }}
            >
              <span style={{ ...styles.legendDot, background: cfg.dot }} />
              <span style={styles.legendLabel}>{cfg.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={styles.mapWrapper}>
        {mapped.length === 0 ? (
          <div style={styles.mapEmpty}>
            <span style={styles.emptyIcon}>◫</span>
            <p style={styles.emptyText}>Belum ada kiosk dengan koordinat GPS</p>
          </div>
        ) : (
          <MapContainer
            center={defaultCenter}
            zoom={10}
            style={{ width: "100%", height: "100%", borderRadius: "10px" }}
            zoomControl={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <FitBounds kiosks={mapped} />
            {filtered.map(kiosk => {
              const cfg = STATUS_CONFIG[kiosk.status] || STATUS_CONFIG.never_connected
              return (
                <CircleMarker
                  key={kiosk.id}
                  center={[kiosk.latitude, kiosk.longitude]}
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
                        <span style={styles.popupVal}>{kiosk.latitude.toFixed(5)}, {kiosk.longitude.toFixed(5)}</span>
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              )
            })}
          </MapContainer>
        )}
      </div>
    </div>
  )
}

function KioskCard({ kiosk, onForceUpdate, isForcing }) {
  const cfg = STATUS_CONFIG[kiosk.status] || STATUS_CONFIG.never_connected
  return (
    <div style={styles.kioskCard}>
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
          {kiosk.status !== "never_connected" && (
            <button
              onClick={() => onForceUpdate(kiosk.id)}
              disabled={isForcing}
              style={isForcing ? { ...styles.forceBtn, opacity: 0.5 } : styles.forceBtn}
              onMouseEnter={e => Object.assign(e.currentTarget.style, styles.forceBtnHover)}
              onMouseLeave={e => Object.assign(e.currentTarget.style, styles.forceBtn)}
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

  const kiosks = kioskData?.results ?? kioskData ?? []
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
          {/* View toggle */}
          <div style={styles.viewToggle}>
            <button
              onClick={() => setView("grid")}
              style={view === "grid" ? { ...styles.viewBtn, ...styles.viewBtnActive } : styles.viewBtn}
              title="Grid view"
            >
              <GridIcon />
            </button>
            <button
              onClick={() => setView("map")}
              style={view === "map" ? { ...styles.viewBtn, ...styles.viewBtnActive } : styles.viewBtn}
              title="Map view"
            >
              <MapPinIcon />
            </button>
          </div>
          <div style={styles.refreshNote}>
            <span style={styles.refreshDot} />
            <span style={styles.refreshText}>Auto-refresh setiap 30 detik</span>
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
            <StatCard label="Total Kiosks"      value={summary?.total         ?? 0} color="#d5b57e" icon="▦" />
            <StatCard label="Online"             value={summary?.online        ?? 0} color="#418840" icon="●" />
            <StatCard label="Offline"            value={summary?.offline       ?? 0} color="#d83a2f" icon="●" />
            <StatCard label="Stale Content"      value={summary?.stale         ?? 0} color="#b98e52" icon="◐" />
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
              { key: "all",            label: "Semua" },
              { key: "online",         label: "Online" },
              { key: "offline",        label: "Offline" },
              { key: "stale",          label: "Stale" },
              { key: "never_connected",label: "Belum Terhubung" },
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
          background: #1a1a18 !important;
          font-family: 'Inter', 'Plus Jakarta Sans', sans-serif;
        }
        .leaflet-popup-content-wrapper {
          background: #2b2b27 !important;
          border: 1px solid #3a3a36 !important;
          border-radius: 10px !important;
          box-shadow: 0 8px 24px rgba(0,0,0,0.4) !important;
          color: #fff9eb !important;
          padding: 0 !important;
        }
        .leaflet-popup-tip {
          background: #2b2b27 !important;
        }
        .leaflet-popup-content {
          margin: 0 !important;
        }
        .leaflet-control-zoom a {
          background: #2b2b27 !important;
          border-color: #3a3a36 !important;
          color: #808180 !important;
        }
        .leaflet-control-zoom a:hover {
          background: #333330 !important;
          color: #fff9eb !important;
        }
        .leaflet-control-attribution {
          background: rgba(30,30,28,0.8) !important;
          color: #5a5956 !important;
          font-size: 10px !important;
        }
        .leaflet-control-attribution a { color: #808180 !important; }
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

// ── Styles ─────────────────────────────────────────────────
const styles = {
  page: {
    fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
    color: "#fff9eb",
    maxWidth: "1400px",
  },
  pageHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: "32px",
  },
  pageTitle: {
    fontFamily: "''Inter', 'Plus Jakarta Sans', sans-serif",
    fontSize: "28px",
    fontWeight: 600,
    color: "#fff9eb",
    margin: "0 0 4px",
    letterSpacing: "1px",
  },
  pageSubtitle: {
    fontSize: "14px",
    color: "#808180",
    margin: 0,
    fontWeight: 300,
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  viewToggle: {
    display: "flex",
    background: "#2b2b27",
    border: "1px solid #3a3a36",
    borderRadius: "8px",
    overflow: "hidden",
  },
  viewBtn: {
    background: "transparent",
    border: "none",
    padding: "7px 11px",
    cursor: "pointer",
    color: "#5a5956",
    display: "flex",
    alignItems: "center",
    transition: "all 0.15s",
  },
  viewBtnActive: {
    background: "rgba(42,79,133,0.3)",
    color: "#fff9eb",
  },
  refreshNote: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "#2b2b27",
    border: "1px solid #3a3a36",
    borderRadius: "20px",
    padding: "6px 14px",
  },
  refreshDot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    background: "#418840",
    animation: "pulse 2s ease infinite",
    display: "inline-block",
  },
  refreshText: {
    fontSize: "12px",
    color: "#808180",
  },

  // Stats
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "16px",
    marginBottom: "28px",
  },
  statCard: {
    background: "#2b2b27",
    border: "1px solid #3a3a36",
    borderTop: "3px solid",
    borderRadius: "10px",
    padding: "20px 24px",
  },
  statTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "10px",
  },
  statIcon: {
    fontSize: "18px",
    color: "#5a5956",
  },
  statValue: {
    fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
    fontSize: "36px",
    fontWeight: 600,
    lineHeight: 1,
  },
  statLabel: {
    fontSize: "12px",
    color: "#808180",
    letterSpacing: "0.5px",
    textTransform: "uppercase",
    fontWeight: 500,
  },
  loadingRow: {
    display: "contents",
  },
  skeletonCard: {
    display: "block",
    height: "100px",
    borderRadius: "10px",
    background: "linear-gradient(90deg, #2b2b27 25%, #333330 50%, #2b2b27 75%)",
    backgroundSize: "800px 100%",
    animation: "shimmer 1.5s infinite",
  },

  // Map
  mapSection: {
    background: "#2b2b27",
    border: "1px solid #3a3a36",
    borderRadius: "10px",
    overflow: "hidden",
    marginBottom: "28px",
  },
  mapHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 20px",
    borderBottom: "1px solid #3a3a36",
    flexWrap: "wrap",
    gap: "12px",
  },
  mapTitle: {
    fontSize: "15px",
    fontWeight: 600,
    color: "#fff9eb",
    margin: "0 0 2px",
  },
  mapSubtitle: {
    fontSize: "12px",
    color: "#5a5956",
    margin: 0,
  },
  mapLegend: {
    display: "flex",
    gap: "4px",
    flexWrap: "wrap",
  },
  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    background: "transparent",
    border: "1px solid #3a3a36",
    borderRadius: "20px",
    padding: "4px 10px",
    cursor: "pointer",
    transition: "all 0.15s",
  },
  legendDot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    flexShrink: 0,
  },
  legendLabel: {
    fontSize: "11px",
    color: "#808180",
    whiteSpace: "nowrap",
  },
  mapWrapper: {
    height: "420px",
    position: "relative",
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
    borderBottom: "1px solid #3a3a36",
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
    color: "#fff9eb",
  },
  popupGrid: {
    display: "grid",
    gridTemplateColumns: "auto 1fr",
    gap: "5px 12px",
    alignItems: "center",
  },
  popupKey: {
    fontSize: "11px",
    color: "#5a5956",
    whiteSpace: "nowrap",
  },
  popupVal: {
    fontSize: "12px",
    color: "#b2a893",
    fontWeight: 400,
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
    background: "transparent",
    border: "1px solid #3a3a36",
    borderRadius: "20px",
    padding: "6px 16px",
    fontSize: "13px",
    color: "#808180",
    cursor: "pointer",
    fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
    transition: "all 0.15s",
  },
  filterTabActive: {
    background: "#2a4f85",
    border: "1px solid #2a4f85",
    color: "#fff9eb",
  },
  filterCount: {
    background: "#3a3a36",
    borderRadius: "10px",
    padding: "1px 7px",
    fontSize: "11px",
    color: "#808180",
  },
  filterCountActive: {
    background: "rgba(255,249,235,0.15)",
    color: "#fff9eb",
  },

  // Kiosk grid
  kioskGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
    gap: "16px",
  },
  kioskSkeleton: {
    height: "200px",
    borderRadius: "10px",
    background: "linear-gradient(90deg, #2b2b27 25%, #333330 50%, #2b2b27 75%)",
    backgroundSize: "800px 100%",
    animation: "shimmer 1.5s infinite",
  },
  kioskCard: {
    background: "#2b2b27",
    border: "1px solid #3a3a36",
    borderRadius: "10px",
    overflow: "hidden",
    position: "relative",
    transition: "border-color 0.2s",
  },
  kioskCardAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "3px",
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
    fontSize: "15px",
    fontWeight: 600,
    color: "#fff9eb",
    margin: "0 0 3px",
  },
  kioskRegion: {
    fontSize: "12px",
    color: "#808180",
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
    fontWeight: 500,
    letterSpacing: "0.3px",
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
    background: "#232320",
    borderRadius: "8px",
    padding: "12px",
  },
  kioskMetaItem: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  kioskMetaLabel: {
    fontSize: "10px",
    color: "#5a5956",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    fontWeight: 500,
  },
  kioskMetaValue: {
    fontSize: "13px",
    color: "#b2a893",
    fontWeight: 400,
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
    background: "#2a4f85",
    flexShrink: 0,
  },
  playlistChipText: {
    fontSize: "12px",
    color: "#808180",
  },
  forceBtn: {
    background: "transparent",
    border: "1px solid #3a3a36",
    borderRadius: "6px",
    padding: "5px 12px",
    fontSize: "12px",
    color: "#808180",
    cursor: "pointer",
    fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
    transition: "all 0.15s",
  },
  forceBtnHover: {
    background: "rgba(216,58,47,0.1)",
    border: "1px solid rgba(216,58,47,0.4)",
    borderRadius: "6px",
    padding: "5px 12px",
    fontSize: "12px",
    color: "#f2767c",
    cursor: "pointer",
    fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
    transition: "all 0.15s",
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
    color: "#3a3a36",
  },
  emptyText: {
    fontSize: "14px",
    color: "#5a5956",
    margin: 0,
  },
}
