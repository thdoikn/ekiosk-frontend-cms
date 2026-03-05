import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import client from "../../api/client"

// ── API ────────────────────────────────────────────────────
const fetchKiosk     = (id) => client.get(`/kiosks/${id}/`).then(r => r.data)
const fetchLogs      = (id) => client.get(`/kiosks/${id}/logs/`).then(r => r.data)
const fetchPlaylists = ()   => client.get("/playlists/?is_active=true").then(r => r.data)
const doForceUpdate  = (id) => client.post(`/kiosks/${id}/force-update/`)
const doOverride     = ({ id, playlist_override }) =>
  client.patch(`/kiosks/${id}/`, { playlist_override })

// ── Helpers ────────────────────────────────────────────────
const STATUS_CFG = {
  online:          { label: "Online",          bg: "#1a3322", text: "#86ac69", dot: "#418840", glow: "rgba(65,136,64,0.3)" },
  offline:         { label: "Offline",         bg: "#2e1a1a", text: "#f2767c", dot: "#d83a2f", glow: "rgba(216,58,47,0.3)" },
  stale:           { label: "Stale Content",   bg: "#2e2510", text: "#dbaf6c", dot: "#b98e52", glow: "rgba(185,142,82,0.3)" },
  never_connected: { label: "Never Connected", bg: "#222220", text: "#808180", dot: "#5a5956", glow: "rgba(90,89,86,0.2)"  },
}

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return "—"
  if (bytes > 1e9) return `${(bytes / 1e9).toFixed(2)} GB`
  if (bytes > 1e6) return `${(bytes / 1e6).toFixed(1)} MB`
  return `${bytes} B`
}

function formatDate(str) {
  if (!str) return "—"
  return new Date(str).toLocaleString("id-ID", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit"
  })
}

function timeSince(dateStr) {
  if (!dateStr) return "Never"
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (diff < 60)    return `${diff} detik lalu`
  if (diff < 3600)  return `${Math.floor(diff / 60)} menit lalu`
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`
  return `${Math.floor(diff / 86400)} hari lalu`
}

// ── Sub-components ─────────────────────────────────────────
function StatusBadge({ status, large }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.never_connected
  return (
    <span style={{
      ...S.badge,
      background: cfg.bg,
      color: cfg.text,
      fontSize: large ? "13px" : "11px",
      padding: large ? "6px 14px" : "4px 10px",
      boxShadow: large ? `0 0 20px ${cfg.glow}` : "none",
    }}>
      <span style={{
        ...S.badgeDot,
        background: cfg.dot,
        width: large ? "8px" : "6px",
        height: large ? "8px" : "6px",
        animation: status === "online" ? "pulse 2s ease infinite" : "none",
      }} />
      {cfg.label}
    </span>
  )
}

function DiagCard({ label, value, mono, accent }) {
  return (
    <div style={S.diagCard}>
      <span style={S.diagLabel}>{label}</span>
      <span style={{
        ...S.diagValue,
        fontFamily: mono ? "'DM Mono', monospace" : "'DM Sans', sans-serif",
        color: accent ?? "#fff9eb",
        fontSize: mono ? "13px" : "15px",
      }}>
        {value ?? "—"}
      </span>
    </div>
  )
}

function StorageBar({ used, total }) {
  if (!used || !total) return <span style={{ color: "#5a5956" }}>—</span>
  const pct = Math.min(100, Math.round((1 - used / total) * 100))
  const color = pct > 80 ? "#d83a2f" : pct > 60 ? "#b98e52" : "#418840"
  return (
    <div style={S.storageWrap}>
      <div style={S.storageBar}>
        <div style={{ ...S.storageBarFill, width: `${pct}%`, background: color }} />
      </div>
      <span style={{ ...S.storageLabel, color }}>{pct}% used</span>
    </div>
  )
}

function SectionHeader({ title, action }) {
  return (
    <div style={S.sectionHeader}>
      <h3 style={S.sectionTitle}>{title}</h3>
      {action}
    </div>
  )
}

// ── Main ───────────────────────────────────────────────────
export default function KioskDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [forcing, setForcing]         = useState(false)
  const [overrideId, setOverrideId]   = useState("")
  const [showOverride, setShowOverride] = useState(false)

  const { data: kiosk, isLoading } = useQuery({
    queryKey: ["kiosk", id],
    queryFn: () => fetchKiosk(id),
    refetchInterval: 30000,
  })

  const { data: logsData } = useQuery({
    queryKey: ["kiosk-logs", id],
    queryFn: () => fetchLogs(id),
  })

  const { data: playlistsData } = useQuery({
    queryKey: ["playlists-active"],
    queryFn: fetchPlaylists,
    enabled: showOverride,
  })

  const forceMut = useMutation({
    mutationFn: () => doForceUpdate(id),
    onMutate: () => setForcing(true),
    onSettled: () => { setForcing(false); qc.invalidateQueries(["kiosk", id]) },
  })

  const overrideMut = useMutation({
    mutationFn: (pid) => doOverride({ id, playlist_override: pid || null }),
    onSettled: () => {
      setShowOverride(false)
      qc.invalidateQueries(["kiosk", id])
    },
  })

  const logs      = logsData?.results ?? logsData ?? []
  const playlists = playlistsData?.results ?? playlistsData ?? []
  const cfg       = STATUS_CFG[kiosk?.status] || STATUS_CFG.never_connected

  if (isLoading) {
    return (
      <div style={S.page}>
        <style>{ANIM_CSS}</style>
        <div style={S.loadingGrid}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{ ...S.skeleton, animationDelay: `${i * 0.07}s` }} />
          ))}
        </div>
      </div>
    )
  }

  if (!kiosk) {
    return (
      <div style={S.page}>
        <style>{ANIM_CSS}</style>
        <div style={S.notFound}>
          <span style={S.notFoundIcon}>◫</span>
          <p style={S.notFoundText}>Kiosk tidak ditemukan</p>
          <button style={S.backBtn} onClick={() => navigate("/kiosks")}>← Kembali</button>
        </div>
      </div>
    )
  }

  return (
    <div style={S.page}>
      <style>{ANIM_CSS}</style>

      {/* Back + header */}
      <div style={S.topRow}>
        <button style={S.backBtn} onClick={() => navigate("/kiosks")}>
          ← Kembali ke Daftar
        </button>
      </div>

      {/* Hero card */}
      <div style={{ ...S.heroCard, borderTopColor: cfg.dot }}>
        {/* Ambient glow */}
        <div style={{ ...S.heroGlow, background: cfg.glow }} />

        <div style={S.heroInner}>
          <div style={S.heroLeft}>
            <div style={S.heroIconWrap}>
              <MonitorIcon color={cfg.dot} />
            </div>
            <div>
              <h2 style={S.heroName}>{kiosk.name}</h2>
              <p style={S.heroRegion}>{kiosk.region?.name ?? "Tidak ada region"}</p>
              <div style={S.heroMeta}>
                <span style={S.heroMetaItem}>
                  ID: <span style={S.heroMetaMono}>{String(kiosk.id).slice(0, 16)}…</span>
                </span>
                <span style={S.heroMetaDot}>·</span>
                <span style={S.heroMetaItem}>
                  Terdaftar: {formatDate(kiosk.registered_at)}
                </span>
              </div>
            </div>
          </div>

          <div style={S.heroRight}>
            <StatusBadge status={kiosk.status} large />
            <div style={S.heroActions}>
              <button
                style={forcing ? { ...S.forceBtn, opacity: 0.5 } : S.forceBtn}
                disabled={forcing}
                onClick={() => forceMut.mutate()}
                onMouseEnter={e => !forcing && Object.assign(e.currentTarget.style, S.forceBtnHover)}
                onMouseLeave={e => !forcing && Object.assign(e.currentTarget.style, S.forceBtn)}
              >
                <RefreshIcon /> {forcing ? "Mengirim…" : "Force Update"}
              </button>
              {kiosk.force_update && (
                <span style={S.pendingChip}>
                  <span style={S.pendingDot} />
                  Update Pending
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Two-column body */}
      <div style={S.bodyGrid}>

        {/* LEFT COLUMN */}
        <div style={S.leftCol}>

          {/* Diagnostics */}
          <div style={S.card}>
            <SectionHeader title="Diagnostik Perangkat" />
            <div style={S.diagGrid}>
              <DiagCard label="IP Address"    value={kiosk.last_ip_address}   mono />
              <DiagCard label="App Version"   value={kiosk.last_app_version}  mono accent="#d5b57e" />
              <DiagCard label="OS Version"    value={kiosk.last_os_version}   mono />
              <DiagCard label="Heartbeat"     value={timeSince(kiosk.last_heartbeat)} accent={kiosk.status === "offline" ? "#f2767c" : "#86ac69"} />
              <DiagCard label="Storage Bebas" value={formatBytes(kiosk.last_storage_free)} />
              <DiagCard label="Memory Bebas"  value={formatBytes(kiosk.last_memory_free)} />
            </div>

            {/* Storage bar */}
            <div style={S.diagStorageRow}>
              <span style={S.diagLabel}>Penggunaan Storage</span>
              <StorageBar used={kiosk.last_storage_free} total={32 * 1e9} />
            </div>
          </div>

          {/* Content status */}
          <div style={S.card}>
            <SectionHeader title="Status Konten" />
            <div style={S.hashRow}>
              <div style={S.hashItem}>
                <span style={S.diagLabel}>Hash Kiosk Saat Ini</span>
                <span style={S.hashValue}>
                  {kiosk.last_known_hash
                    ? kiosk.last_known_hash.slice(0, 24) + "…"
                    : "Belum ada data"}
                </span>
              </div>
              <div style={S.hashArrow}>→</div>
              <div style={S.hashItem}>
                <span style={S.diagLabel}>Hash Playlist Aktif</span>
                <span style={{
                  ...S.hashValue,
                  color: kiosk.last_known_hash === kiosk.active_playlist?.hash
                    ? "#86ac69" : "#f2767c"
                }}>
                  {kiosk.active_playlist?.hash
                    ? kiosk.active_playlist.hash.slice(0, 24) + "…"
                    : "Tidak ada playlist"}
                </span>
              </div>
            </div>
            {kiosk.last_known_hash && kiosk.active_playlist?.hash && (
              <div style={{
                ...S.syncBanner,
                background: kiosk.last_known_hash === kiosk.active_playlist.hash
                  ? "rgba(65,136,64,0.1)" : "rgba(216,58,47,0.1)",
                borderColor: kiosk.last_known_hash === kiosk.active_playlist.hash
                  ? "rgba(65,136,64,0.3)" : "rgba(216,58,47,0.3)",
                color: kiosk.last_known_hash === kiosk.active_playlist.hash
                  ? "#86ac69" : "#f2767c",
              }}>
                {kiosk.last_known_hash === kiosk.active_playlist.hash
                  ? "✓ Konten kiosk sudah sinkron"
                  : "✗ Konten kiosk belum diperbarui — gunakan Force Update"}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div style={S.rightCol}>

          {/* Playlist assignment */}
          <div style={S.card}>
            <SectionHeader
              title="Playlist Aktif"
              action={
                <button
                  style={S.editBtn}
                  onClick={() => setShowOverride(!showOverride)}
                >
                  {showOverride ? "Batal" : "Ubah Override"}
                </button>
              }
            />

            {/* Current assignment info */}
            <div style={S.playlistInfo}>
              <div style={S.playlistInfoRow}>
                <span style={S.diagLabel}>Sumber</span>
                <span style={{
                  ...S.sourceBadge,
                  background: kiosk.playlist_override ? "rgba(27,129,138,0.2)" : "rgba(42,79,133,0.2)",
                  color: kiosk.playlist_override ? "#1b9b97" : "#7ba3d4",
                }}>
                  {kiosk.playlist_override ? "Override Kiosk" : "Dari Region"}
                </span>
              </div>
              <div style={S.playlistInfoRow}>
                <span style={S.diagLabel}>Nama Playlist</span>
                <span style={S.playlistName}>
                  {kiosk.active_playlist?.name ?? "—"}
                </span>
              </div>
              {kiosk.active_playlist && (
                <div style={S.playlistInfoRow}>
                  <span style={S.diagLabel}>Hash</span>
                  <span style={S.playlistHash}>
                    {kiosk.active_playlist.hash?.slice(0, 16)}…
                  </span>
                </div>
              )}
            </div>

            {/* Override panel */}
            {showOverride && (
              <div style={S.overridePanel}>
                <div style={S.overrideDivider} />
                <p style={S.overrideHint}>
                  Pilih playlist untuk di-override pada kiosk ini, atau kosongkan untuk menggunakan playlist region.
                </p>
                <select
                  style={S.overrideSelect}
                  value={overrideId}
                  onChange={e => setOverrideId(e.target.value)}
                >
                  <option value="">— Gunakan Playlist Region —</option>
                  {playlists.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <button
                  style={S.saveOverrideBtn}
                  onClick={() => overrideMut.mutate(overrideId || null)}
                  disabled={overrideMut.isPending}
                >
                  {overrideMut.isPending ? "Menyimpan…" : "Simpan Override"}
                </button>
              </div>
            )}
          </div>

          {/* Heartbeat log */}
          <div style={S.card}>
            <SectionHeader title="Log Heartbeat Terakhir" />
            {logs.length === 0 ? (
              <p style={S.noLogs}>Belum ada log heartbeat</p>
            ) : (
              <div style={S.logsList}>
                {logs.slice(0, 10).map((log, i) => (
                  <div key={log.id ?? i} style={S.logRow}>
                    <div style={S.logLeft}>
                      <span style={{
                        ...S.logDot,
                        background: log.is_up_to_date ? "#418840" : "#b98e52"
                      }} />
                      <div>
                        <span style={S.logTime}>{formatDate(log.checked_at)}</span>
                        <span style={S.logHash}>
                          {log.reported_hash?.slice(0, 12) ?? "—"}…
                        </span>
                      </div>
                    </div>
                    <span style={{
                      fontSize: "11px",
                      color: log.is_up_to_date ? "#86ac69" : "#dbaf6c",
                    }}>
                      {log.is_up_to_date ? "Sinkron" : "Stale"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}

// ── Icons ──────────────────────────────────────────────────
function MonitorIcon({ color = "#808180" }) {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
      <rect x="2" y="3" width="20" height="14" rx="2"/>
      <line x1="8" y1="21" x2="16" y2="21"/>
      <line x1="12" y1="17" x2="12" y2="21"/>
    </svg>
  )
}
function RefreshIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6 }}>
      <polyline points="23 4 23 10 17 10"/>
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
    </svg>
  )
}

// ── Styles ─────────────────────────────────────────────────
const ANIM_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600&family=DM+Mono:wght@400&family=DM+Sans:wght@300;400;500;600&display=swap');
  @keyframes fadeUp   { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes shimmer  { 0%{background-position:-600px 0} 100%{background-position:600px 0} }
  @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:0.4} }
`

const S = {
  page: {
    fontFamily: "'DM Sans', sans-serif",
    color: "#fff9eb",
    maxWidth: "1200px",
    animation: "fadeUp 0.4s ease both",
  },
  topRow: {
    marginBottom: "20px",
  },
  backBtn: {
    background: "transparent",
    border: "1px solid #2e2e2a",
    borderRadius: "6px",
    padding: "7px 14px",
    fontSize: "13px",
    color: "#808180",
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    transition: "color 0.15s",
  },

  // Hero card
  heroCard: {
    background: "#1e1e1c",
    border: "1px solid #2e2e2a",
    borderTop: "3px solid",
    borderRadius: "12px",
    padding: "28px 32px",
    marginBottom: "20px",
    position: "relative",
    overflow: "hidden",
  },
  heroGlow: {
    position: "absolute",
    top: "-60px",
    right: "-60px",
    width: "200px",
    height: "200px",
    borderRadius: "50%",
    filter: "blur(60px)",
    pointerEvents: "none",
  },
  heroInner: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "20px",
    position: "relative",
    zIndex: 1,
    flexWrap: "wrap",
  },
  heroLeft: {
    display: "flex",
    alignItems: "flex-start",
    gap: "20px",
  },
  heroIconWrap: {
    width: "52px",
    height: "52px",
    background: "#252522",
    border: "1px solid #3a3a36",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  heroName: {
    fontFamily: "'Cinzel', serif",
    fontSize: "22px",
    fontWeight: 600,
    color: "#fff9eb",
    margin: "0 0 4px",
    letterSpacing: "0.5px",
  },
  heroRegion: {
    fontSize: "13px",
    color: "#808180",
    margin: "0 0 10px",
  },
  heroMeta: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  heroMetaItem: {
    fontSize: "11px",
    color: "#5a5956",
  },
  heroMetaMono: {
    fontFamily: "'DM Mono', monospace",
    color: "#808180",
  },
  heroMetaDot: {
    color: "#3a3a36",
  },
  heroRight: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "12px",
  },
  heroActions: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  forceBtn: {
    display: "inline-flex",
    alignItems: "center",
    background: "rgba(42,79,133,0.2)",
    border: "1px solid rgba(42,79,133,0.4)",
    borderRadius: "8px",
    padding: "8px 16px",
    fontSize: "13px",
    color: "#7ba3d4",
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 500,
    transition: "all 0.15s",
  },
  forceBtnHover: {
    display: "inline-flex",
    alignItems: "center",
    background: "rgba(42,79,133,0.35)",
    border: "1px solid rgba(42,79,133,0.6)",
    borderRadius: "8px",
    padding: "8px 16px",
    fontSize: "13px",
    color: "#a8c4e8",
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 500,
    transition: "all 0.15s",
    boxShadow: "0 4px 16px rgba(42,79,133,0.25)",
  },
  pendingChip: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    background: "rgba(185,142,82,0.15)",
    border: "1px solid rgba(185,142,82,0.3)",
    borderRadius: "20px",
    padding: "5px 12px",
    fontSize: "12px",
    color: "#dbaf6c",
  },
  pendingDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "#b98e52",
    animation: "pulse 1.5s ease infinite",
    display: "inline-block",
  },

  // Badge
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    borderRadius: "20px",
    fontWeight: 500,
  },
  badgeDot: {
    borderRadius: "50%",
    flexShrink: 0,
  },

  // Body layout
  bodyGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
    alignItems: "start",
  },
  leftCol:  { display: "flex", flexDirection: "column", gap: "16px" },
  rightCol: { display: "flex", flexDirection: "column", gap: "16px" },

  // Cards
  card: {
    background: "#1e1e1c",
    border: "1px solid #2e2e2a",
    borderRadius: "12px",
    padding: "20px 24px",
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
  },
  sectionTitle: {
    fontSize: "11px",
    fontWeight: 600,
    color: "#5a5956",
    letterSpacing: "1.5px",
    textTransform: "uppercase",
    margin: 0,
  },
  editBtn: {
    background: "transparent",
    border: "1px solid #2e2e2a",
    borderRadius: "6px",
    padding: "4px 10px",
    fontSize: "11px",
    color: "#808180",
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
  },

  // Diag grid
  diagGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "1px",
    background: "#2e2e2a",
    borderRadius: "8px",
    overflow: "hidden",
    marginBottom: "16px",
  },
  diagCard: {
    background: "#1e1e1c",
    padding: "12px 14px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  diagLabel: {
    fontSize: "10px",
    color: "#5a5956",
    textTransform: "uppercase",
    letterSpacing: "0.8px",
    fontWeight: 600,
  },
  diagValue: {
    fontWeight: 500,
    lineHeight: 1.3,
    wordBreak: "break-all",
  },
  diagStorageRow: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  storageWrap: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  storageBar: {
    flex: 1,
    height: "6px",
    background: "#2e2e2a",
    borderRadius: "3px",
    overflow: "hidden",
  },
  storageBarFill: {
    height: "100%",
    borderRadius: "3px",
    transition: "width 0.5s ease",
  },
  storageLabel: {
    fontSize: "12px",
    fontFamily: "'DM Mono', monospace",
    flexShrink: 0,
    minWidth: "60px",
  },

  // Hash / sync
  hashRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "12px",
  },
  hashItem: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    background: "#252522",
    borderRadius: "8px",
    padding: "12px",
  },
  hashArrow: {
    color: "#3a3a36",
    fontSize: "18px",
    flexShrink: 0,
  },
  hashValue: {
    fontFamily: "'DM Mono', monospace",
    fontSize: "12px",
    color: "#808180",
    wordBreak: "break-all",
  },
  syncBanner: {
    border: "1px solid",
    borderRadius: "8px",
    padding: "10px 14px",
    fontSize: "13px",
    fontWeight: 500,
  },

  // Playlist info
  playlistInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginBottom: "4px",
  },
  playlistInfoRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sourceBadge: {
    fontSize: "12px",
    borderRadius: "4px",
    padding: "3px 8px",
    fontWeight: 500,
  },
  playlistName: {
    fontSize: "14px",
    fontWeight: 600,
    color: "#fff9eb",
  },
  playlistHash: {
    fontFamily: "'DM Mono', monospace",
    fontSize: "11px",
    color: "#5a5956",
  },
  overridePanel: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  overrideDivider: {
    height: "1px",
    background: "#2e2e2a",
    margin: "4px 0",
  },
  overrideHint: {
    fontSize: "12px",
    color: "#5a5956",
    margin: 0,
    lineHeight: 1.5,
  },
  overrideSelect: {
    background: "#1a1a18",
    border: "1px solid #3a3a36",
    borderRadius: "8px",
    padding: "9px 12px",
    fontSize: "13px",
    color: "#b2a893",
    fontFamily: "'DM Sans', sans-serif",
    outline: "none",
    width: "100%",
  },
  saveOverrideBtn: {
    background: "linear-gradient(135deg, #2a4f85, #1b818a)",
    border: "none",
    borderRadius: "8px",
    padding: "10px",
    fontSize: "13px",
    fontWeight: 600,
    color: "#fff9eb",
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    width: "100%",
  },

  // Logs
  noLogs: {
    fontSize: "13px",
    color: "#5a5956",
    textAlign: "center",
    padding: "20px 0",
    margin: 0,
  },
  logsList: {
    display: "flex",
    flexDirection: "column",
    gap: "1px",
    background: "#2e2e2a",
    borderRadius: "8px",
    overflow: "hidden",
  },
  logRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 12px",
    background: "#1e1e1c",
    transition: "background 0.1s",
  },
  logLeft: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  logDot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    flexShrink: 0,
  },
  logTime: {
    fontSize: "12px",
    color: "#808180",
    display: "block",
    marginBottom: "2px",
  },
  logHash: {
    fontFamily: "'DM Mono', monospace",
    fontSize: "10px",
    color: "#5a5956",
    display: "block",
  },

  // Loading states
  loadingGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
  },
  skeleton: {
    height: "200px",
    borderRadius: "12px",
    background: "linear-gradient(90deg, #1e1e1c 25%, #252522 50%, #1e1e1c 75%)",
    backgroundSize: "600px 100%",
    animation: "shimmer 1.4s infinite",
  },
  notFound: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "80px 20px",
    gap: "12px",
  },
  notFoundIcon: { fontSize: "48px", color: "#3a3a36" },
  notFoundText: { fontSize: "14px", color: "#5a5956", margin: 0 },
}
