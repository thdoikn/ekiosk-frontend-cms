import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import client from "../../api/client"

// ── API ────────────────────────────────────────────────────
const fetchRegions   = () => client.get("/regions/").then(r => r.data)
const fetchPlaylists = () => client.get("/playlists/?is_active=true").then(r => r.data)
const createRegion   = (data) => client.post("/regions/", data)
const updateRegion   = ({ id, ...data }) => client.put(`/regions/${id}/`, data)
const deleteRegion   = (id) => client.delete(`/regions/${id}/`)
const assignPlaylist = ({ regionId, playlistId }) =>
  client.post(`/regions/${regionId}/assign-playlist/`, { playlist_id: playlistId })

// ── Modal ──────────────────────────────────────────────────
function Modal({ open, onClose, children }) {
  if (!open) return null
  return (
    <div style={S.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={S.modal}>
        {children}
      </div>
    </div>
  )
}

// ── Confirm Dialog ─────────────────────────────────────────
function ConfirmDialog({ open, title, message, onConfirm, onCancel, danger }) {
  if (!open) return null
  return (
    <div style={S.overlay}>
      <div style={S.confirmBox}>
        <h3 style={S.confirmTitle}>{title}</h3>
        <p style={S.confirmMsg}>{message}</p>
        <div style={S.confirmActions}>
          <button style={S.btnGhost} onClick={onCancel}>Batal</button>
          <button
            style={danger ? S.btnDanger : S.btnPrimary}
            onClick={onConfirm}
          >
            Konfirmasi
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Region Form ────────────────────────────────────────────
function RegionForm({ initial, onSubmit, onClose, loading }) {
  const [name, setName] = useState(initial?.name ?? "")
  const [desc, setDesc] = useState(initial?.description ?? "")

  const handleSubmit = () => {
    if (!name.trim()) return
    onSubmit({ name: name.trim(), description: desc.trim() })
  }

  return (
    <div style={S.formWrap}>
      <div style={S.formHeader}>
        <h3 style={S.formTitle}>
          {initial ? "Edit Region" : "Tambah Region Baru"}
        </h3>
        <button style={S.closeBtn} onClick={onClose}>✕</button>
      </div>

      <div style={S.fieldGroup}>
        <label style={S.label}>Nama Region <span style={{ color: "#C0392B" }}>*</span></label>
        <input
          style={S.input}
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="cth. Kawasan Inti Pusat Pemerintahan"
          onFocus={e => Object.assign(e.target.style, S.inputFocus)}
          onBlur={e => Object.assign(e.target.style, S.input)}
        />
      </div>

      <div style={S.fieldGroup}>
        <label style={S.label}>Deskripsi</label>
        <textarea
          style={S.textarea}
          value={desc}
          onChange={e => setDesc(e.target.value)}
          placeholder="Deskripsi singkat tentang region ini..."
          rows={3}
          onFocus={e => Object.assign(e.target.style, S.textareaFocus)}
          onBlur={e => Object.assign(e.target.style, S.textarea)}
        />
      </div>

      <div style={S.formActions}>
        <button style={S.btnGhost} onClick={onClose}>Batal</button>
        <button
          style={loading ? { ...S.btnPrimary, opacity: 0.6 } : S.btnPrimary}
          onClick={handleSubmit}
          disabled={loading || !name.trim()}
        >
          {loading ? "Menyimpan…" : initial ? "Simpan Perubahan" : "Buat Region"}
        </button>
      </div>
    </div>
  )
}

// ── Assign Playlist Modal ──────────────────────────────────
function AssignModal({ region, playlists, onAssign, onClose, loading }) {
  const [selected, setSelected] = useState(
    region?.active_playlist?.id ?? ""
  )

  return (
    <div style={S.formWrap}>
      <div style={S.formHeader}>
        <div>
          <h3 style={S.formTitle}>Assign Playlist</h3>
          <p style={S.formSubtitle}>Region: <strong style={{ color: "#2D6A4F" }}>{region?.name}</strong></p>
        </div>
        <button style={S.closeBtn} onClick={onClose}>✕</button>
      </div>

      <div style={S.playlistPickerGrid}>
        {playlists.map(p => (
          <button
            key={p.id}
            onClick={() => setSelected(p.id)}
            style={{
              ...S.playlistPickerItem,
              boxShadow: selected === p.id ? NM_I_SM : NM_S,
              color: selected === p.id ? "#2D6A4F" : "#7A7670",
            }}
          >
            <div style={S.pickerCheck}>
              {selected === p.id && <span style={S.pickerCheckInner} />}
            </div>
            <div style={S.pickerInfo}>
              <span style={S.pickerName}>{p.name}</span>
              <span style={S.pickerMeta}>
                {p.items?.length ?? 0} item · {
                  p.assigned_regions?.length
                    ? p.assigned_regions.map(r => r.name).join(', ')
                    : "Belum di-assign ke region"
                }
              </span>
            </div>
            {selected === p.id && (
              <span style={S.pickerActiveBadge}>Dipilih</span>
            )}
          </button>
        ))}
        {playlists.length === 0 && (
          <p style={{ color: "#8A8680", fontSize: "13px", textAlign: "center", padding: "20px 0" }}>
            Belum ada playlist aktif
          </p>
        )}
      </div>

      <div style={S.formActions}>
        <button style={S.btnGhost} onClick={onClose}>Batal</button>
        <button
          style={!selected || loading ? { ...S.btnPrimary, opacity: 0.5 } : S.btnPrimary}
          disabled={!selected || loading}
          onClick={() => onAssign(selected)}
        >
          {loading ? "Menyimpan…" : "Assign Playlist"}
        </button>
      </div>
    </div>
  )
}

// ── Region Card ────────────────────────────────────────────
function RegionCard({ region, index, onEdit, onDelete, onAssign }) {
  const kioskCount = region.kiosk_count ?? 0

  return (
    <div
      style={{ ...S.regionCard, animationDelay: `${index * 0.06}s` }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = "8px 8px 18px #C4BFB8, -8px -8px 18px #FFFFFF"}
      onMouseLeave={e => e.currentTarget.style.boxShadow = "6px 6px 14px #C4BFB8, -6px -6px 14px #FFFFFF"}
    >
      {/* Top accent stripe */}
      <div style={{
        ...S.regionStripe,
        background: `linear-gradient(90deg, ${REGION_COLORS[index % REGION_COLORS.length]}, transparent)`
      }} />

      <div style={S.regionCardInner}>
        {/* Header */}
        <div style={S.regionCardTop}>
          <div style={{
            ...S.regionIcon,
            background: `${REGION_COLORS[index % REGION_COLORS.length]}18`,
            border: `1px solid ${REGION_COLORS[index % REGION_COLORS.length]}44`,
          }}>
            <MapPinIcon color={REGION_COLORS[index % REGION_COLORS.length]} />
          </div>
          <div style={S.regionCardActions}>
            <button style={S.iconBtn} onClick={() => onEdit(region)} title="Edit">
              <EditIcon />
            </button>
            <button style={S.iconBtnDanger} onClick={() => onDelete(region)} title="Hapus">
              <TrashIcon />
            </button>
          </div>
        </div>

        {/* Name + desc */}
        <h3 style={S.regionName}>{region.name}</h3>
        <p style={S.regionDesc}>{region.description || "Tidak ada deskripsi"}</p>

        {/* Stats row */}
        <div style={S.regionStats}>
          <div style={S.regionStat}>
            <span style={S.regionStatValue}>{kioskCount}</span>
            <span style={S.regionStatLabel}>Kiosk</span>
          </div>
          <div style={S.regionStatDivider} />
          <div style={S.regionStat}>
            <span style={{
              ...S.regionStatValue,
              color: region.active_playlist ? "#2D6A4F" : "#8A8680",
              fontSize: "12px",
              fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
            }}>
              {region.active_playlist?.name ?? "—"}
            </span>
            <span style={S.regionStatLabel}>Playlist Aktif</span>
          </div>
        </div>

        {/* Assign button */}
        <button
          style={S.assignBtn}
          onClick={() => onAssign(region)}
          onMouseEnter={e => Object.assign(e.currentTarget.style, S.assignBtnHover)}
          onMouseLeave={e => Object.assign(e.currentTarget.style, S.assignBtn)}
        >
          <PlaylistIcon /> Assign Playlist
        </button>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────
export default function RegionListPage() {
  const qc = useQueryClient()
  const [modal, setModal]       = useState(null) // null | 'create' | 'edit' | 'assign' | 'delete'
  const [selected, setSelected] = useState(null)

  const { data: regionData, isLoading } = useQuery({
    queryKey: ["regions"],
    queryFn: fetchRegions,
  })

  const { data: playlistData } = useQuery({
    queryKey: ["playlists-active"],
    queryFn: fetchPlaylists,
    enabled: modal === "assign",
  })

  const regions   = regionData?.results  ?? regionData  ?? []
  const playlists = playlistData?.results ?? playlistData ?? []

  const createMut = useMutation({
    mutationFn: createRegion,
    onSuccess: () => { qc.invalidateQueries(["regions"]); setModal(null) },
  })

  const updateMut = useMutation({
    mutationFn: updateRegion,
    onSuccess: () => { qc.invalidateQueries(["regions"]); setModal(null) },
  })

  const deleteMut = useMutation({
    mutationFn: deleteRegion,
    onSuccess: () => { qc.invalidateQueries(["regions"]); setModal(null) },
  })

  const assignMut = useMutation({
    mutationFn: assignPlaylist,
    onSuccess: () => { qc.invalidateQueries(["regions"]); setModal(null) },
  })

  const openEdit   = (r) => { setSelected(r); setModal("edit")   }
  const openDelete = (r) => { setSelected(r); setModal("delete") }
  const openAssign = (r) => { setSelected(r); setModal("assign") }
  const closeModal = ()  => { setModal(null); setSelected(null)  }

  return (
    <div style={S.page}>
      <style>{ANIM_CSS}</style>

      {/* Header */}
      <div style={S.header}>
        <div>
          <h1 style={S.pageTitle}>Region Management</h1>
          <p style={S.pageSub}>{regions.length} region terdaftar</p>
        </div>
        <button
          style={S.btnPrimary}
          onClick={() => setModal("create")}
          onMouseEnter={e => Object.assign(e.currentTarget.style, S.btnPrimaryHover)}
          onMouseLeave={e => Object.assign(e.currentTarget.style, S.btnPrimary)}
        >
          <PlusIcon /> Tambah Region
        </button>
      </div>

      {/* Cards grid */}
      {isLoading ? (
        <div style={S.grid}>
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{ ...S.skeleton, animationDelay: `${i * 0.08}s` }} />
          ))}
        </div>
      ) : regions.length === 0 ? (
        <div style={S.empty}>
          <MapPinIcon color="#C5BFB8" size={40} />
          <p style={S.emptyTitle}>Belum ada region</p>
          <p style={S.emptyText}>Buat region pertama untuk mulai mengatur kiosk berdasarkan lokasi</p>
          <button style={S.btnPrimary} onClick={() => setModal("create")}>
            <PlusIcon /> Buat Region Pertama
          </button>
        </div>
      ) : (
        <div style={S.grid}>
          {regions.map((r, i) => (
            <RegionCard
              key={r.id}
              region={r}
              index={i}
              onEdit={openEdit}
              onDelete={openDelete}
              onAssign={openAssign}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <Modal open={modal === "create"} onClose={closeModal}>
        <RegionForm
          onSubmit={(data) => createMut.mutate(data)}
          onClose={closeModal}
          loading={createMut.isPending}
        />
      </Modal>

      <Modal open={modal === "edit"} onClose={closeModal}>
        <RegionForm
          initial={selected}
          onSubmit={(data) => updateMut.mutate({ id: selected.id, ...data })}
          onClose={closeModal}
          loading={updateMut.isPending}
        />
      </Modal>

      <Modal open={modal === "assign"} onClose={closeModal}>
        <AssignModal
          region={selected}
          playlists={playlists}
          onAssign={(pid) => assignMut.mutate({ regionId: selected.id, playlistId: pid })}
          onClose={closeModal}
          loading={assignMut.isPending}
        />
      </Modal>

      <ConfirmDialog
        open={modal === "delete"}
        title="Hapus Region"
        message={`Yakin ingin menghapus region "${selected?.name}"? Kiosk yang terkait tidak akan terhapus, namun assignment region akan hilang.`}
        onConfirm={() => deleteMut.mutate(selected.id)}
        onCancel={closeModal}
        danger
      />
    </div>
  )
}

// ── Constants ──────────────────────────────────────────────
const REGION_COLORS = [
  "#2a4f85", "#1b818a", "#618a48", "#d83a2f",
  "#b98e52", "#87191b", "#234421", "#175085",
]

// ── Icons ──────────────────────────────────────────────────
function MapPinIcon({ color = "#8A8680", size = 20 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
}
function PlusIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: 6 }}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
}
function EditIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
}
function TrashIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
}
function PlaylistIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6 }}><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
}

// ── Neuromorphic tokens ────────────────────────────────────
const NM   = "#E4E0DB"
const NM_U = "6px 6px 14px #C4BFB8, -6px -6px 14px #FFFFFF"
const NM_S = "4px 4px 10px #C4BFB8, -4px -4px 10px #FFFFFF"
const NM_I = "inset 4px 4px 10px #C4BFB8, inset -4px -4px 10px #FFFFFF"
const NM_I_SM = "inset 3px 3px 7px #C4BFB8, inset -3px -3px 7px #FFFFFF"

// ── Styles ─────────────────────────────────────────────────
const ANIM_CSS = `
  @keyframes fadeUp   { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  @keyframes shimmer  { 0%{background-position:-600px 0} 100%{background-position:600px 0} }
  @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
  @keyframes slideUp  { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
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
  pageSub: {
    fontSize: "13px",
    color: "#8A8680",
    margin: 0,
    fontWeight: 300,
  },

  // Grid
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "20px",
  },

  // Region card
  regionCard: {
    background: NM,
    border: "none",
    borderRadius: "14px",
    overflow: "hidden",
    transition: "box-shadow 0.22s",
    animation: "fadeUp 0.4s ease both",
    position: "relative",
    boxShadow: NM_U,
  },
  regionStripe: {
    height: "3px",
    width: "100%",
  },
  regionCardInner: {
    padding: "20px",
  },
  regionCardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "14px",
  },
  regionIcon: {
    width: "40px",
    height: "40px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  regionCardActions: {
    display: "flex",
    gap: "6px",
  },
  regionName: {
    fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
    fontSize: "15px",
    fontWeight: 600,
    color: "#1A1A18",
    margin: "0 0 6px",
    letterSpacing: "0.3px",
    lineHeight: 1.3,
  },
  regionDesc: {
    fontSize: "12px",
    color: "#8A8680",
    margin: "0 0 16px",
    lineHeight: 1.5,
    minHeight: "36px",
    fontWeight: 300,
  },
  regionStats: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    background: NM,
    borderRadius: "10px",
    padding: "10px 14px",
    marginBottom: "14px",
    boxShadow: NM_I_SM,
  },
  regionStat: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    flex: 1,
  },
  regionStatValue: {
    fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
    fontSize: "20px",
    fontWeight: 600,
    color: "#C49A3C",
    lineHeight: 1,
  },
  regionStatLabel: {
    fontSize: "10px",
    color: "#8A8680",
    textTransform: "uppercase",
    letterSpacing: "0.8px",
    fontWeight: 600,
  },
  regionStatDivider: {
    width: "1px",
    height: "32px",
    background: "#C4BFB8",
    flexShrink: 0,
  },
  assignBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    background: NM,
    border: "none",
    borderRadius: "10px",
    padding: "9px",
    fontSize: "12px",
    color: "#7A7670",
    cursor: "pointer",
    fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
    fontWeight: 500,
    transition: "box-shadow 0.18s",
    boxShadow: NM_S,
  },
  assignBtnHover: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    background: NM,
    border: "none",
    borderRadius: "10px",
    padding: "9px",
    fontSize: "12px",
    color: "#2D6A4F",
    cursor: "pointer",
    fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
    fontWeight: 500,
    transition: "box-shadow 0.18s",
    boxShadow: NM_I_SM,
  },

  // Icon buttons
  iconBtn: {
    background: NM,
    border: "none",
    borderRadius: "8px",
    width: "30px",
    height: "30px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#7A7670",
    cursor: "pointer",
    transition: "box-shadow 0.18s",
    boxShadow: NM_S,
  },
  iconBtnDanger: {
    background: NM,
    border: "none",
    borderRadius: "8px",
    width: "30px",
    height: "30px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#C0392B",
    cursor: "pointer",
    transition: "box-shadow 0.18s",
    boxShadow: NM_S,
  },

  // Modal overlay
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
    maxWidth: "480px",
    animation: "slideUp 0.25s ease both",
    overflow: "hidden",
    boxShadow: NM_U,
  },
  confirmBox: {
    background: NM,
    border: "none",
    borderRadius: "16px",
    width: "100%",
    maxWidth: "380px",
    padding: "28px",
    animation: "slideUp 0.25s ease both",
    boxShadow: NM_U,
  },
  confirmTitle: {
    fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
    fontSize: "17px",
    color: "#1A1A18",
    margin: "0 0 10px",
  },
  confirmMsg: {
    fontSize: "13px",
    color: "#7A7670",
    lineHeight: 1.6,
    margin: "0 0 24px",
  },
  confirmActions: {
    display: "flex",
    gap: "10px",
    justifyContent: "flex-end",
  },

  // Form
  formWrap: {
    padding: "24px",
  },
  formHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "20px",
  },
  formTitle: {
    fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
    fontSize: "17px",
    color: "#1A1A18",
    margin: 0,
    letterSpacing: "0.3px",
  },
  formSubtitle: {
    fontSize: "12px",
    color: "#8A8680",
    margin: "4px 0 0",
    fontWeight: 300,
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
    marginBottom: "16px",
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
  inputFocus: {
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
    boxShadow: "inset 3px 3px 7px #B8B4AE, inset -3px -3px 7px #FFFFFF",
  },
  textarea: {
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
    resize: "vertical",
    lineHeight: 1.5,
    boxShadow: NM_I_SM,
  },
  textareaFocus: {
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
    resize: "vertical",
    lineHeight: 1.5,
    boxShadow: "inset 3px 3px 7px #B8B4AE, inset -3px -3px 7px #FFFFFF",
  },
  formActions: {
    display: "flex",
    gap: "10px",
    justifyContent: "flex-end",
    marginTop: "4px",
  },

  // Playlist picker
  playlistPickerGrid: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginBottom: "20px",
    maxHeight: "300px",
    overflowY: "auto",
  },
  playlistPickerItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 14px",
    borderRadius: "10px",
    border: "none",
    cursor: "pointer",
    transition: "box-shadow 0.18s",
    fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
    textAlign: "left",
    background: NM,
    boxShadow: NM_S,
  },
  pickerCheck: {
    width: "16px",
    height: "16px",
    borderRadius: "50%",
    border: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    background: NM,
    boxShadow: NM_I_SM,
  },
  pickerCheckInner: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "#2D6A4F",
    display: "block",
  },
  pickerInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "3px",
    flex: 1,
  },
  pickerName: {
    fontSize: "13px",
    fontWeight: 600,
    color: "#1A1A18",
  },
  pickerMeta: {
    fontSize: "11px",
    color: "#8A8680",
  },
  pickerActiveBadge: {
    fontSize: "10px",
    background: "rgba(45,106,79,0.12)",
    color: "#2D6A4F",
    borderRadius: "4px",
    padding: "2px 7px",
    flexShrink: 0,
    fontWeight: 600,
  },

  // Buttons
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
    letterSpacing: "0.3px",
  },
  btnPrimaryHover: {
    display: "inline-flex",
    alignItems: "center",
    background: "linear-gradient(135deg, #235c42, #17898b)",
    border: "none",
    borderRadius: "8px",
    padding: "10px 18px",
    fontSize: "13px",
    fontWeight: 600,
    color: "#FFFFFF",
    cursor: "pointer",
    fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
    transition: "all 0.15s",
    letterSpacing: "0.3px",
    boxShadow: "0 6px 20px rgba(45,106,79,0.25)",
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
    transition: "box-shadow 0.18s",
    boxShadow: NM_S,
  },
  btnDanger: {
    display: "inline-flex",
    alignItems: "center",
    background: NM,
    border: "none",
    borderRadius: "8px",
    padding: "9px 16px",
    fontSize: "13px",
    color: "#C0392B",
    cursor: "pointer",
    fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
    transition: "box-shadow 0.18s",
    fontWeight: 600,
    boxShadow: NM_S,
  },

  // Empty + loading
  empty: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "80px 20px",
    gap: "12px",
    textAlign: "center",
  },
  emptyTitle: {
    fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
    fontSize: "18px",
    color: "#7A7670",
    margin: 0,
  },
  emptyText: {
    fontSize: "13px",
    color: "#8A8680",
    margin: "0 0 8px",
    maxWidth: "320px",
    lineHeight: 1.6,
  },
  skeleton: {
    height: "240px",
    borderRadius: "14px",
    background: "linear-gradient(90deg, #D8D4CF 25%, #E8E4DF 50%, #D8D4CF 75%)",
    backgroundSize: "600px 100%",
    animation: "shimmer 1.4s infinite",
  },
}
