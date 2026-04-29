import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import client from "../../api/client"

// ── API ────────────────────────────────────────────────────
const fetchPlaylists = () => client.get("/playlists/").then(r => r.data)
const createPlaylist = (data) => client.post("/playlists/", data)
const deletePlaylist = (id) => client.delete(`/playlists/${id}/`)
const toggleActive   = ({ id, is_active }) => client.patch(`/playlists/${id}/`, { is_active })

// ── Icons ──────────────────────────────────────────────────
function PlusIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: 6 }}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
}
function FilmIcon({ size = 16, color = "#8A8680" }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/></svg>
}
function TrashIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
}
function BuilderIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6 }}><polygon points="5 3 19 12 5 21 5 3"/></svg>
}

// ── Animation CSS ──────────────────────────────────────────
const ANIM_CSS = `
  @keyframes fadeUp  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
  @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes shimmer { 0%{background-position:-600px 0} 100%{background-position:600px 0} }
`

// ── Create Modal ───────────────────────────────────────────
function CreateModal({ onClose, onSubmit, loading }) {
  const [name, setName] = useState("")

  return (
    <div style={S.overlay}>
      <div style={S.modal}>
        <div style={S.modalHeader}>
          <h3 style={S.modalTitle}>Buat Playlist Baru</h3>
          <button style={S.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div style={S.fieldGroup}>
          <label style={S.label}>
            Nama Playlist <span style={{ color: "#C0392B" }}>*</span>
          </label>
          <input
            style={S.input}
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="cth. Konten Lobby Utama"
            onFocus={e => (e.target.style.borderColor = "#C49A3C")}
            onBlur={e => (e.target.style.borderColor = "#E5E0D8")}
          />
        </div>
        <p style={S.hint}>
          Setelah dibuat, tambahkan media ke playlist melalui Playlist Builder.
        </p>
        <div style={S.modalActions}>
          <button style={S.btnGhost} onClick={onClose}>Batal</button>
          <button
            style={!name.trim() || loading ? { ...S.btnPrimary, opacity: 0.5 } : S.btnPrimary}
            disabled={!name.trim() || loading}
            onClick={() => onSubmit({ name: name.trim() })}
          >
            {loading ? "Membuat…" : "Buat Playlist"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────
export default function PlaylistListPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ["playlists"],
    queryFn: fetchPlaylists,
  })

  const createMut = useMutation({
    mutationFn: createPlaylist,
    onSuccess: (res) => {
      qc.invalidateQueries(["playlists"])
      setShowCreate(false)
      navigate(`/playlists/${res.data.id}`)
    },
  })

  const deleteMut = useMutation({
    mutationFn: deletePlaylist,
    onSuccess: () => qc.invalidateQueries(["playlists"]),
  })

  const toggleMut = useMutation({
    mutationFn: toggleActive,
    onSuccess: () => qc.invalidateQueries(["playlists"]),
  })

  const playlists = data?.results ?? data ?? []

  return (
    <div style={S.page}>
      <style>{ANIM_CSS}</style>

      <div style={S.header}>
        <div>
          <h1 style={S.pageTitle}>Playlist Management</h1>
          <p style={S.pageSub}>{playlists.length} playlist tersedia</p>
        </div>
        <button
          style={S.btnPrimary}
          onClick={() => setShowCreate(true)}
          onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 6px 20px rgba(45,106,79,0.25)")}
          onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}
        >
          <PlusIcon /> Buat Playlist
        </button>
      </div>

      {isLoading ? (
        <div style={S.grid}>
          {[...Array(4)].map((_, i) => <div key={i} style={S.skeleton} />)}
        </div>
      ) : playlists.length === 0 ? (
        <div style={S.empty}>
          <FilmIcon size={40} color="#C5BFB8" />
          <p style={S.emptyTitle}>Belum ada playlist</p>
          <button style={S.btnPrimary} onClick={() => setShowCreate(true)}>
            <PlusIcon /> Buat Playlist Pertama
          </button>
        </div>
      ) : (
        <div style={S.grid}>
          {playlists.map((p, i) => (
            <div
              key={p.id}
              style={{ ...S.card, animationDelay: `${i * 0.05}s` }}
              onMouseEnter={e => {
                e.currentTarget.style.boxShadow = "8px 8px 18px #D0CCCA, -8px -8px 18px #FFFFFF"
              }}
              onMouseLeave={e => {
                e.currentTarget.style.boxShadow = "6px 6px 14px #D0CCCA, -6px -6px 14px #FFFFFF"
              }}
            >
              <div style={S.cardTop}>
                <div style={S.cardIconWrap}>
                  <FilmIcon size={18} color={p.is_active ? "#C49A3C" : "#8A8680"} />
                </div>
                <div style={S.cardActions}>
                  <button
                    style={p.is_active ? S.activeBadge : S.inactiveBadge}
                    onClick={() => toggleMut.mutate({ id: p.id, is_active: !p.is_active })}
                  >
                    {p.is_active ? "Aktif" : "Nonaktif"}
                  </button>
                </div>
              </div>

              <h3 style={S.cardName}>{p.name}</h3>
              <p style={S.cardRegion}>
                {p.assigned_regions?.length > 0
                  ? p.assigned_regions.map(r => r.name).join(', ')
                  : <span style={{ color: "#C5BFB8" }}>Belum diassign ke region</span>
                }
              </p>

              <div style={S.cardMeta}>
                <div style={S.cardMetaItem}>
                  <span style={S.cardMetaValue}>{p.items?.length ?? 0}</span>
                  <span style={S.cardMetaLabel}>Media</span>
                </div>
                <div style={S.cardMetaDivider} />
                <div style={S.cardMetaItem}>
                  <span style={{
                    ...S.cardMetaValue,
                    fontSize: "11px",
                    fontFamily: "'DM Mono', monospace",
                  }}>
                    {p.hash ? p.hash.slice(0, 8) + "…" : "—"}
                  </span>
                  <span style={S.cardMetaLabel}>Hash</span>
                </div>
              </div>

              <div style={S.cardFooter}>
                <button
                  style={S.builderBtn}
                  onClick={() => navigate(`/playlists/${p.id}`)}
                  onMouseEnter={e => Object.assign(e.currentTarget.style, S.builderBtnHover)}
                  onMouseLeave={e => Object.assign(e.currentTarget.style, S.builderBtn)}
                >
                  <BuilderIcon /> Buka Builder
                </button>
                <button
                  style={S.iconBtnDanger}
                  onClick={() => {
                    if (window.confirm(`Hapus playlist "${p.name}"?`)) {
                      deleteMut.mutate(p.id)
                    }
                  }}
                >
                  <TrashIcon />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onSubmit={d => createMut.mutate(d)}
          loading={createMut.isPending}
        />
      )}
    </div>
  )
}

// ── Neuromorphic tokens ────────────────────────────────────
const NM   = "#EDEAE6"
const NM_U = "6px 6px 14px #D0CCCA, -6px -6px 14px #FFFFFF"
const NM_S = "4px 4px 10px #D0CCCA, -4px -4px 10px #FFFFFF"
const NM_I = "inset 4px 4px 10px #D0CCCA, inset -4px -4px 10px #FFFFFF"
const NM_I_SM = "inset 3px 3px 7px #D0CCCA, inset -3px -3px 7px #FFFFFF"

// ── Styles ─────────────────────────────────────────────────
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
    marginBottom: "28px",
  },
  pageTitle: {
    fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
    fontSize: "26px",
    fontWeight: 600,
    color: "#1A1A18",
    margin: "0 0 4px",
    letterSpacing: "0.5px",
  },
  pageSub: { fontSize: "13px", color: "#8A8680", margin: 0, fontWeight: 300 },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: "20px",
  },
  card: {
    background: NM,
    border: "none",
    borderRadius: "14px",
    padding: "20px",
    animation: "fadeUp 0.4s ease both",
    transition: "box-shadow 0.22s",
    boxShadow: NM_U,
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "12px",
  },
  cardIconWrap: {
    width: "36px",
    height: "36px",
    background: NM,
    border: "none",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: NM_I_SM,
  },
  cardActions: { display: "flex", gap: "6px" },
  activeBadge: {
    fontSize: "11px",
    background: "rgba(45,106,79,0.12)",
    border: "1px solid rgba(45,106,79,0.25)",
    color: "#2D6A4F",
    borderRadius: "20px",
    padding: "3px 10px",
    cursor: "pointer",
    fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
    fontWeight: 600,
  },
  inactiveBadge: {
    fontSize: "11px",
    background: NM,
    border: "none",
    color: "#8A8680",
    borderRadius: "20px",
    padding: "3px 10px",
    cursor: "pointer",
    fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
    boxShadow: NM_I_SM,
  },
  cardName: {
    fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
    fontSize: "14px",
    fontWeight: 600,
    color: "#1A1A18",
    margin: "0 0 4px",
    letterSpacing: "0.3px",
  },
  cardRegion: { fontSize: "12px", color: "#8A8680", margin: "0 0 14px" },
  cardMeta: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    background: NM,
    borderRadius: "10px",
    padding: "10px 12px",
    marginBottom: "12px",
    boxShadow: NM_I_SM,
  },
  cardMetaItem: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    flex: 1,
  },
  cardMetaValue: {
    fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
    fontSize: "18px",
    fontWeight: 600,
    color: "#C49A3C",
    lineHeight: 1,
  },
  cardMetaLabel: {
    fontSize: "10px",
    color: "#8A8680",
    textTransform: "uppercase",
    letterSpacing: "0.8px",
    fontWeight: 600,
  },
  cardMetaDivider: {
    width: "1px",
    height: "28px",
    background: "#D0CCCA",
    flexShrink: 0,
  },
  cardFooter: { display: "flex", gap: "8px", alignItems: "center" },
  builderBtn: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: NM,
    border: "none",
    borderRadius: "9px",
    padding: "8px",
    fontSize: "12px",
    color: "#7A7670",
    cursor: "pointer",
    fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
    transition: "box-shadow 0.18s",
    fontWeight: 500,
    boxShadow: NM_S,
  },
  builderBtnHover: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: NM,
    border: "none",
    borderRadius: "9px",
    padding: "8px",
    fontSize: "12px",
    color: "#2D6A4F",
    cursor: "pointer",
    fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
    transition: "box-shadow 0.18s",
    fontWeight: 500,
    boxShadow: NM_I_SM,
  },
  iconBtnDanger: {
    background: NM,
    border: "none",
    borderRadius: "9px",
    width: "34px",
    height: "34px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#C0392B",
    cursor: "pointer",
    boxShadow: NM_S,
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    animation: "fadeIn 0.2s ease both",
    padding: "20px",
  },
  modal: {
    background: NM,
    border: "none",
    borderRadius: "16px",
    width: "100%",
    maxWidth: "420px",
    padding: "24px",
    animation: "slideUp 0.25s ease both",
    boxShadow: NM_U,
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  modalTitle: {
    fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
    fontSize: "17px",
    color: "#1A1A18",
    margin: 0,
    letterSpacing: "0.3px",
  },
  closeBtn: {
    background: "transparent",
    border: "none",
    color: "#8A8680",
    fontSize: "16px",
    cursor: "pointer",
    padding: "2px 6px",
    fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginBottom: "12px",
  },
  label: {
    fontSize: "11px",
    fontWeight: 600,
    color: "#7A7670",
    letterSpacing: "0.8px",
    textTransform: "uppercase",
  },
  input: {
    background: NM,
    border: "none",
    borderRadius: "10px",
    padding: "11px 14px",
    fontSize: "14px",
    color: "#1A1A18",
    fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    boxShadow: NM_I_SM,
  },
  hint: {
    fontSize: "12px",
    color: "#8A8680",
    margin: "0 0 20px",
    lineHeight: 1.5,
  },
  modalActions: {
    display: "flex",
    gap: "10px",
    justifyContent: "flex-end",
  },
  btnPrimary: {
    display: "inline-flex",
    alignItems: "center",
    background: "linear-gradient(135deg, #2D6A4F, #1b818a)",
    border: "none",
    borderRadius: "8px",
    padding: "10px 18px",
    fontSize: "13px",
    fontWeight: 600,
    color: "#FFFFFF",
    cursor: "pointer",
    fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
    transition: "all 0.15s",
  },
  btnGhost: {
    display: "inline-flex",
    alignItems: "center",
    background: NM,
    border: "none",
    borderRadius: "8px",
    padding: "9px 16px",
    fontSize: "13px",
    color: "#7A7670",
    cursor: "pointer",
    fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
    boxShadow: NM_S,
  },
  empty: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "80px 20px",
    gap: "12px",
  },
  emptyTitle: {
    fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
    fontSize: "18px",
    color: "#7A7670",
    margin: 0,
  },
  skeleton: {
    height: "220px",
    borderRadius: "14px",
    background: "linear-gradient(90deg, #D8D4CF 25%, #E8E4DF 50%, #D8D4CF 75%)",
    backgroundSize: "600px 100%",
    animation: "shimmer 1.4s infinite",
  },
}
