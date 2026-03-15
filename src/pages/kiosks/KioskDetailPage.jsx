import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import client from "../../api/client"

// ── API ────────────────────────────────────────────────────
const fetchKiosk     = (id) => client.get(`/kiosks/${id}/`).then(r => r.data)
const fetchLogs      = (id, page) => client.get(`/kiosks/${id}/logs/?page=${page}`).then(r => r.data)
const fetchPlaylists = ()   => client.get("/playlists/?is_active=true").then(r => r.data)
const fetchRegions   = ()   => client.get("/regions/").then(r => r.data)
const doForceUpdate  = (id) => client.post(`/kiosks/${id}/force-update/`)
const doOverride     = ({ id, playlist_override }) =>
  client.patch(`/kiosks/${id}/`, { playlist_override })
const doAssignRegion = ({ id, region }) =>
  client.patch(`/kiosks/${id}/`, { region })

// ── Helpers ────────────────────────────────────────────────
const APP_STATE_CFG = {
  foreground: { label: "Aktif",          sub: "Layar sedang menyala",          icon: "▶", color: "#2D6A4F", bg: "#E8F4EC" },
  background: { label: "Latar Belakang", sub: "Berjalan di balik layar",       icon: "◑", color: "#1b818a", bg: "#E6F4F5" },
  terminated: { label: "Tidak Aktif",    sub: "Aplikasi dihentikan/crash",     icon: "■", color: "#C0392B", bg: "#FDECEA" },
}

const STATUS_CFG = {
  online:          { label: "Online",          bg: "#E8F4EC", text: "#2D6A4F", dot: "#418840", glow: "rgba(45,106,79,0.12)"  },
  offline:         { label: "Offline",         bg: "#FDECEA", text: "#C0392B", dot: "#D83A2F", glow: "rgba(216,58,47,0.12)"  },
  stale:           { label: "Stale Content",   bg: "#FEF5E7", text: "#9B7228", dot: "#C49A3C", glow: "rgba(196,154,60,0.12)" },
  never_connected: { label: "Never Connected", bg: "#F3F2F0", text: "#6A6860", dot: "#9A9890", glow: "rgba(154,152,144,0.1)" },
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
        fontFamily: mono ? "monospace" : "'Inter', sans-serif",
        color: accent ?? "#1A1A18",
        fontSize: mono ? "13px" : "15px",
      }}>
        {value ?? "—"}
      </span>
    </div>
  )
}

function StorageBar({ used, total }) {
  if (!used || !total) return <span style={{ color: "#A8A49C" }}>—</span>
  const pct = Math.min(100, Math.round((1 - used / total) * 100))
  const color = pct > 80 ? "#D83A2F" : pct > 60 ? "#C49A3C" : "#418840"
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
  const [forcing, setForcing]           = useState(false)
  const [overrideId, setOverrideId]     = useState("")
  const [showOverride, setShowOverride] = useState(false)
  const [showRegion, setShowRegion]     = useState(false)
  const [regionId, setRegionId]         = useState("")
  const [logPage, setLogPage]           = useState(1)

  // Reset log page when navigating to a different kiosk
  const prevId = useState(id)[0]
  if (prevId !== id) setLogPage(1)

  const { data: kiosk, isLoading } = useQuery({
    queryKey: ["kiosk", id],
    queryFn: () => fetchKiosk(id),
    refetchInterval: 30000,
  })

  const { data: logsData } = useQuery({
    queryKey: ["kiosk-logs", id, logPage],
    queryFn: () => fetchLogs(id, logPage),
    refetchInterval: 30000,
  })

  const { data: playlistsData } = useQuery({
    queryKey: ["playlists-active"],
    queryFn: fetchPlaylists,
    enabled: showOverride,
  })

  const { data: regionsData } = useQuery({
    queryKey: ["regions"],
    queryFn: fetchRegions,
    enabled: showRegion,
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

  const regionMut = useMutation({
    mutationFn: (rid) => doAssignRegion({ id, region: rid || null }),
    onSettled: () => {
      setShowRegion(false)
      qc.invalidateQueries(["kiosk", id])
      qc.invalidateQueries(["kiosks"])
    },
  })

  const logs      = logsData?.results ?? []
  const logCount  = logsData?.count ?? 0
  const logTotalPages = Math.max(1, Math.ceil(logCount / 20))
  const playlists = playlistsData?.results ?? playlistsData ?? []
  const regions   = regionsData?.results ?? regionsData ?? []
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
        <div style={{ ...S.heroGlow, background: cfg.glow }} />

        <div style={S.heroInner}>
          <div style={S.heroLeft}>
            <div style={S.heroIconWrap}>
              <MonitorIcon color={cfg.dot} />
            </div>
            <div>
              <h2 style={S.heroName}>{kiosk.name}</h2>

              {/* Region row with edit */}
              <div style={S.heroRegionRow}>
                {showRegion ? (
                  <div style={S.regionEditRow}>
                    <select
                      style={S.regionSelect}
                      value={regionId}
                      onChange={e => setRegionId(e.target.value)}
                      autoFocus
                    >
                      <option value="">— Tanpa Region —</option>
                      {regions.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                    <button
                      style={S.saveRegionBtn}
                      onClick={() => regionMut.mutate(regionId || null)}
                      disabled={regionMut.isPending}
                    >
                      {regionMut.isPending ? "…" : "Simpan"}
                    </button>
                    <button
                      style={S.cancelRegionBtn}
                      onClick={() => setShowRegion(false)}
                    >
                      Batal
                    </button>
                  </div>
                ) : (
                  <>
                    <p style={S.heroRegion}>{kiosk.region?.name ?? "Tidak ada region"}</p>
                    <button
                      style={S.editRegionBtn}
                      onClick={() => {
                        setRegionId(kiosk.region?.id ?? "")
                        setShowRegion(true)
                      }}
                    >
                      Ubah Region
                    </button>
                  </>
                )}
              </div>

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
              <DiagCard label="App Version"   value={kiosk.last_app_version}  mono accent="#C49A3C" />
              <DiagCard
                label="Status Aplikasi"
                value={
                  APP_STATE_CFG[kiosk.last_app_state]
                    ? `${APP_STATE_CFG[kiosk.last_app_state].icon} ${APP_STATE_CFG[kiosk.last_app_state].label}`
                    : "—"
                }
                accent={APP_STATE_CFG[kiosk.last_app_state]?.color}
              />
              <DiagCard label="Heartbeat"     value={timeSince(kiosk.last_heartbeat)} accent={kiosk.status === "offline" ? "#C0392B" : "#2D6A4F"} />
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
                    ? "#2D6A4F" : "#C0392B"
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
                  ? "#E8F4EC" : "#FDECEA",
                borderColor: kiosk.last_known_hash === kiosk.active_playlist.hash
                  ? "rgba(65,136,64,0.3)" : "rgba(216,58,47,0.3)",
                color: kiosk.last_known_hash === kiosk.active_playlist.hash
                  ? "#2D6A4F" : "#C0392B",
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
                  background: kiosk.playlist_override ? "rgba(27,129,138,0.1)" : "rgba(42,79,133,0.1)",
                  color: kiosk.playlist_override ? "#1b818a" : "#2A4F85",
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
            <SectionHeader
              title="Log Heartbeat Terakhir"
              action={
                <span style={S.logCountBadge}>{logCount} entri</span>
              }
            />
            {logs.length === 0 ? (
              <p style={S.noLogs}>Belum ada log heartbeat</p>
            ) : (
              <>
                <div style={S.logTableWrap}>
                  <table style={S.logTable}>
                    <thead>
                      <tr style={S.logThead}>
                        <th style={S.logTh}>Waktu</th>
                        <th style={S.logTh}>Konten</th>
                        <th style={S.logTh}>IP</th>
                        <th style={S.logTh}>Status App</th>
                        <th style={S.logTh}>Storage</th>
                        <th style={S.logTh}>Mem</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log, i) => {
                        const asCfg = APP_STATE_CFG[log.app_state]
                        return (
                          <tr
                            key={log.id ?? i}
                            style={{ ...S.logTr, background: i % 2 === 0 ? "#FFFFFF" : "#FAFAF8" }}
                          >
                            <td style={S.logTd}>
                              <div style={S.logTimeMain}>{formatDate(log.checked_at)}</div>
                            </td>
                            <td style={S.logTd}>
                              <span style={{
                                ...S.logStatusPill,
                                background: log.is_up_to_date ? "#E8F4EC" : "#FEF5E7",
                                color: log.is_up_to_date ? "#2D6A4F" : "#9B7228",
                              }}>
                                <span style={{
                                  ...S.logDot,
                                  background: log.is_up_to_date ? "#418840" : "#C49A3C",
                                }} />
                                {log.is_up_to_date ? "Sinkron" : "Stale"}
                              </span>
                              <div style={S.logHashSmall}>
                                {log.reported_hash ? log.reported_hash.slice(0, 10) + "…" : "—"}
                              </div>
                            </td>
                            <td style={{ ...S.logTd, ...S.logMono }}>{log.ip_address ?? "—"}</td>
                            <td style={S.logTd}>
                              {asCfg ? (
                                <span style={{
                                  ...S.logStatusPill,
                                  background: asCfg.bg,
                                  color: asCfg.color,
                                }}>
                                  {asCfg.icon} {asCfg.label}
                                </span>
                              ) : (
                                <span style={{ color: "#C0BAB0", fontSize: "11px" }}>—</span>
                              )}
                            </td>
                            <td style={S.logTd}>{formatBytes(log.storage_free)}</td>
                            <td style={S.logTd}>{formatBytes(log.memory_free)}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                {/* Pagination controls */}
                <div style={S.logPagination}>
                  <button
                    style={{ ...S.logPageBtn, opacity: logPage <= 1 ? 0.35 : 1 }}
                    disabled={logPage <= 1}
                    onClick={() => setLogPage(p => p - 1)}
                  >
                    ← Prev
                  </button>
                  <span style={S.logPageInfo}>Hal {logPage} / {logTotalPages}</span>
                  <button
                    style={{ ...S.logPageBtn, opacity: logPage >= logTotalPages ? 0.35 : 1 }}
                    disabled={logPage >= logTotalPages}
                    onClick={() => setLogPage(p => p + 1)}
                  >
                    Next →
                  </button>
                </div>
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}

// ── Icons ──────────────────────────────────────────────────
function MonitorIcon({ color = "#8A8680" }) {
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
  @keyframes fadeUp   { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes shimmer  { 0%{background-position:-600px 0} 100%{background-position:600px 0} }
  @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:0.4} }
`

const S = {
  page: {
    fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
    color: "#1A1A18",
    width: "100%",
    animation: "fadeUp 0.4s ease both",
  },
  topRow: {
    marginBottom: "20px",
  },
  backBtn: {
    background: "transparent",
    border: "1px solid #E5E0D8",
    borderRadius: "6px",
    padding: "7px 14px",
    fontSize: "13px",
    color: "#5A5651",
    cursor: "pointer",
    fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
    transition: "color 0.15s",
  },

  // Hero card
  heroCard: {
    background: "#FFFFFF",
    border: "1px solid #E5E0D8",
    borderTop: "3px solid",
    borderRadius: "12px",
    padding: "28px 32px",
    marginBottom: "20px",
    position: "relative",
    overflow: "hidden",
    boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
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
    background: "#F9F6F1",
    border: "1px solid #E5E0D8",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  heroName: {
    fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
    fontSize: "22px",
    fontWeight: 600,
    color: "#1A1A18",
    margin: "0 0 4px",
    letterSpacing: "0.3px",
  },
  heroRegionRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "10px",
  },
  heroRegion: {
    fontSize: "13px",
    color: "#7A7670",
    margin: 0,
  },
  editRegionBtn: {
    background: "transparent",
    border: "1px solid #E5E0D8",
    borderRadius: "4px",
    padding: "2px 8px",
    fontSize: "11px",
    color: "#7A7670",
    cursor: "pointer",
    fontFamily: "'Inter', sans-serif",
    transition: "all 0.15s",
  },
  regionEditRow: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    flexWrap: "wrap",
  },
  regionSelect: {
    background: "#F9F6F1",
    border: "1px solid #E0DAD0",
    borderRadius: "6px",
    padding: "5px 10px",
    fontSize: "13px",
    color: "#1A1A18",
    fontFamily: "'Inter', sans-serif",
    outline: "none",
    minWidth: "180px",
  },
  saveRegionBtn: {
    background: "#2D6A4F",
    border: "none",
    borderRadius: "6px",
    padding: "5px 12px",
    fontSize: "12px",
    fontWeight: 600,
    color: "#FFFFFF",
    cursor: "pointer",
    fontFamily: "'Inter', sans-serif",
  },
  cancelRegionBtn: {
    background: "transparent",
    border: "1px solid #E5E0D8",
    borderRadius: "6px",
    padding: "5px 10px",
    fontSize: "12px",
    color: "#7A7670",
    cursor: "pointer",
    fontFamily: "'Inter', sans-serif",
  },
  heroMeta: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  heroMetaItem: {
    fontSize: "11px",
    color: "#8A8680",
  },
  heroMetaMono: {
    fontFamily: "monospace",
    color: "#7A7670",
  },
  heroMetaDot: {
    color: "#D0CAC0",
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
    background: "rgba(45,106,79,0.08)",
    border: "1px solid rgba(45,106,79,0.25)",
    borderRadius: "8px",
    padding: "8px 16px",
    fontSize: "13px",
    color: "#2D6A4F",
    cursor: "pointer",
    fontFamily: "'Inter', sans-serif",
    fontWeight: 500,
    transition: "all 0.15s",
  },
  forceBtnHover: {
    display: "inline-flex",
    alignItems: "center",
    background: "rgba(45,106,79,0.15)",
    border: "1px solid rgba(45,106,79,0.4)",
    borderRadius: "8px",
    padding: "8px 16px",
    fontSize: "13px",
    color: "#2D6A4F",
    cursor: "pointer",
    fontFamily: "'Inter', sans-serif",
    fontWeight: 500,
    transition: "all 0.15s",
    boxShadow: "0 4px 12px rgba(45,106,79,0.12)",
  },
  pendingChip: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    background: "#FEF5E7",
    border: "1px solid rgba(196,154,60,0.3)",
    borderRadius: "20px",
    padding: "5px 12px",
    fontSize: "12px",
    color: "#9B7228",
  },
  pendingDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "#C49A3C",
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
    background: "#FFFFFF",
    border: "1px solid #E5E0D8",
    borderRadius: "12px",
    padding: "20px 24px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
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
    color: "#8A8680",
    letterSpacing: "1.5px",
    textTransform: "uppercase",
    margin: 0,
  },
  editBtn: {
    background: "transparent",
    border: "1px solid #E5E0D8",
    borderRadius: "6px",
    padding: "4px 10px",
    fontSize: "11px",
    color: "#7A7670",
    cursor: "pointer",
    fontFamily: "'Inter', sans-serif",
  },

  // Diag grid
  diagGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "1px",
    background: "#E5E0D8",
    borderRadius: "8px",
    overflow: "hidden",
    marginBottom: "16px",
  },
  diagCard: {
    background: "#F9F6F1",
    padding: "12px 14px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  diagLabel: {
    fontSize: "10px",
    color: "#A8A49C",
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
    background: "#E5E0D8",
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
    fontFamily: "monospace",
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
    background: "#F9F6F1",
    borderRadius: "8px",
    padding: "12px",
    border: "1px solid #F0EBE3",
  },
  hashArrow: {
    color: "#C8C2B8",
    fontSize: "18px",
    flexShrink: 0,
  },
  hashValue: {
    fontFamily: "monospace",
    fontSize: "12px",
    color: "#5A5651",
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
    color: "#1A1A18",
  },
  playlistHash: {
    fontFamily: "monospace",
    fontSize: "11px",
    color: "#A8A49C",
  },
  overridePanel: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  overrideDivider: {
    height: "1px",
    background: "#E5E0D8",
    margin: "4px 0",
  },
  overrideHint: {
    fontSize: "12px",
    color: "#8A8680",
    margin: 0,
    lineHeight: 1.5,
  },
  overrideSelect: {
    background: "#F9F6F1",
    border: "1px solid #E0DAD0",
    borderRadius: "8px",
    padding: "9px 12px",
    fontSize: "13px",
    color: "#1A1A18",
    fontFamily: "'Inter', sans-serif",
    outline: "none",
    width: "100%",
  },
  saveOverrideBtn: {
    background: "linear-gradient(135deg, #2D6A4F, #1b818a)",
    border: "none",
    borderRadius: "8px",
    padding: "10px",
    fontSize: "13px",
    fontWeight: 600,
    color: "#FFFFFF",
    cursor: "pointer",
    fontFamily: "'Inter', sans-serif",
    width: "100%",
  },

  // Logs
  noLogs: {
    fontSize: "13px",
    color: "#8A8680",
    textAlign: "center",
    padding: "20px 0",
    margin: 0,
  },
  logCountBadge: {
    fontSize: "11px",
    color: "#8A8680",
    background: "#F0EBE3",
    borderRadius: "10px",
    padding: "2px 8px",
  },
  logTableWrap: {
    overflowX: "auto",
    borderRadius: "8px",
    border: "1px solid #E5E0D8",
  },
  logTable: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "12px",
  },
  logThead: {
    background: "#F9F6F1",
    borderBottom: "1px solid #E5E0D8",
  },
  logTh: {
    padding: "8px 12px",
    textAlign: "left",
    fontSize: "10px",
    fontWeight: 600,
    color: "#A8A49C",
    textTransform: "uppercase",
    letterSpacing: "0.6px",
    whiteSpace: "nowrap",
  },
  logTr: {
    borderBottom: "1px solid #F0EBE3",
  },
  logTd: {
    padding: "9px 12px",
    color: "#5A5651",
    verticalAlign: "middle",
    whiteSpace: "nowrap",
  },
  logTimeMain: {
    fontSize: "12px",
    color: "#4A4845",
  },
  logStatusPill: {
    display: "inline-flex",
    alignItems: "center",
    gap: "5px",
    borderRadius: "10px",
    padding: "2px 8px",
    fontSize: "11px",
    fontWeight: 500,
  },
  logDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    flexShrink: 0,
    display: "inline-block",
  },
  logHashSmall: {
    fontFamily: "monospace",
    fontSize: "10px",
    color: "#B8B2A8",
    marginTop: "2px",
  },
  logMono: {
    fontFamily: "monospace",
    fontSize: "11px",
  },
  logPagination: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    marginTop: "12px",
  },
  logPageBtn: {
    background: "transparent",
    border: "1px solid #E5E0D8",
    borderRadius: "6px",
    padding: "5px 12px",
    fontSize: "12px",
    color: "#5A5651",
    cursor: "pointer",
    fontFamily: "'Inter', sans-serif",
    transition: "all 0.15s",
  },
  logPageInfo: {
    fontSize: "12px",
    color: "#8A8680",
    minWidth: "80px",
    textAlign: "center",
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
    background: "linear-gradient(90deg, #F0EBE3 25%, #F9F5EE 50%, #F0EBE3 75%)",
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
  notFoundIcon: { fontSize: "48px", color: "#D0CAC0" },
  notFoundText: { fontSize: "14px", color: "#8A8680", margin: 0 },
}
