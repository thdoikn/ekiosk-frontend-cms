import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
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
        <div style={styles.refreshNote}>
          <span style={styles.refreshDot} />
          <span style={styles.refreshText}>Auto-refresh setiap 30 detik</span>
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

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes shimmer {
          0% { background-position: -400px 0 }
          100% { background-position: 400px 0 }
        }
      `}</style>
    </div>
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
