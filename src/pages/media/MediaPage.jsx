import { useState, useRef } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import client from "../../api/client"

// ── API ────────────────────────────────────────────────────
const fetchMedia  = () => client.get("/media/").then(r => r.data)
const deleteMedia = (id) => client.delete(`/media/${id}/`)

// ── Helpers ────────────────────────────────────────────────
function formatBytes(bytes) {
  if (!bytes) return "—"
  if (bytes > 1e9) return `${(bytes / 1e9).toFixed(2)} GB`
  if (bytes > 1e6) return `${(bytes / 1e6).toFixed(1)} MB`
  if (bytes > 1e3) return `${(bytes / 1e3).toFixed(0)} KB`
  return `${bytes} B`
}

function formatDate(str) {
  if (!str) return "—"
  return new Date(str).toLocaleDateString("id-ID", {
    day: "2-digit", month: "short", year: "numeric",
  })
}

function detectType(file) {
  if (file.type.startsWith("image/")) return "image"
  if (file.type.startsWith("video/")) return "video"
  return "image"
}

// ── Upload Zone ────────────────────────────────────────────
function UploadZone({ onFiles }) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef()

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length) onFiles(files)
  }

  return (
    <div
      style={{
        ...S.uploadZone,
        borderColor: dragging ? "#C49A3C" : "#D0CCCA",
        background: NM,
      }}
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        style={{ display: "none" }}
        onChange={e => {
          const files = Array.from(e.target.files)
          if (files.length) onFiles(files)
          e.target.value = ""
        }}
      />
      <div style={S.uploadIcon}>
        <UploadIcon />
      </div>
      <p style={S.uploadTitle}>
        {dragging ? "Lepaskan file di sini" : "Klik atau seret file ke sini"}
      </p>
      <p style={S.uploadHint}>
        Mendukung JPG, PNG, GIF, MP4, MOV · Maks 200MB per file
      </p>
    </div>
  )
}

// ── Upload Progress Item ───────────────────────────────────
function UploadItem({ name, progress, error, done }) {
  return (
    <div style={S.uploadItem}>
      <div style={S.uploadItemLeft}>
        <div style={{
          ...S.uploadItemIcon,
          background: error ? "rgba(192,57,43,0.1)"
            : done ? "rgba(45,106,79,0.1)"
            : "rgba(42,79,133,0.1)",
        }}>
          {error ? "✕" : done ? "✓" : <SpinIcon />}
        </div>
        <div>
          <p style={S.uploadItemName}>{name}</p>
          <p style={{
            ...S.uploadItemStatus,
            color: error ? "#C0392B" : done ? "#418840" : "#7A7670",
          }}>
            {error ?? (done ? "Selesai" : `${progress}%`)}
          </p>
        </div>
      </div>
      {!done && !error && (
        <div style={S.uploadBar}>
          <div style={{ ...S.uploadBarFill, width: `${progress}%` }} />
        </div>
      )}
    </div>
  )
}

// ── Media Card ─────────────────────────────────────────────
function MediaCard({ media, onPreview, onDelete, index }) {
  const [hovering, setHovering] = useState(false)

  return (
    <div
      style={{ ...S.mediaCard, animationDelay: `${index * 0.04}s` }}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {/* Thumbnail */}
      <div style={S.cardThumb}>
        {media.media_type === "image" ? (
          <img
            src={media.file_url || media.file}
            alt={media.name}
            style={S.cardThumbImg}
            loading="lazy"
          />
        ) : (
          <div style={S.cardThumbVideo}>
            <FilmIcon size={32} color="#C5BFB8" />
            <span style={S.videoDuration}>
              {media.duration_seconds ? `${media.duration_seconds}s` : "Video"}
            </span>
          </div>
        )}

        {/* Type badge */}
        <span style={{
          ...S.cardTypeBadge,
          background: media.media_type === "image"
            ? "rgba(42,79,133,0.85)" : "rgba(45,106,79,0.85)",
        }}>
          {media.media_type === "image" ? "IMG" : "VID"}
        </span>

        {/* Hover overlay */}
        {hovering && (
          <div style={S.cardOverlay}>
            <button
              style={S.overlayBtn}
              onClick={() => onPreview(media)}
              title="Preview"
            >
              <EyeIcon />
            </button>
            <button
              style={{ ...S.overlayBtn, ...S.overlayBtnDanger }}
              onClick={() => onDelete(media)}
              title="Hapus"
            >
              <TrashIcon />
            </button>
          </div>
        )}
      </div>

      {/* Info */}
      <div style={S.cardInfo}>
        <p style={S.cardName} title={media.name}>{media.name}</p>
        <div style={S.cardMeta}>
          <span style={S.cardMetaItem}>{formatBytes(media.file_size)}</span>
          <span style={S.cardMetaDot}>·</span>
          <span style={S.cardMetaItem}>{formatDate(media.created_at)}</span>
        </div>
        {media.checksum && (
          <p style={S.cardHash}>{media.checksum.slice(0, 12)}…</p>
        )}
      </div>
    </div>
  )
}

// ── Preview Modal ──────────────────────────────────────────
function PreviewModal({ media, onClose }) {
  if (!media) return null
  return (
    <div style={S.previewOverlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={S.previewBox}>
        <div style={S.previewHeader}>
          <div>
            <h3 style={S.previewTitle}>{media.name}</h3>
            <p style={S.previewMeta}>
              {media.media_type} · {formatBytes(media.file_size)} · {formatDate(media.created_at)}
            </p>
          </div>
          <button style={S.previewClose} onClick={onClose}>✕</button>
        </div>

        <div style={S.previewMedia}>
          {media.media_type === "image" ? (
            <img
              src={media.file_url || media.file}
              alt={media.name}
              style={S.previewImg}
            />
          ) : (
            <video
              src={media.file_url || media.file}
              controls
              style={S.previewVideo}
            />
          )}
        </div>

        <div style={S.previewDetails}>
          <div style={S.previewDetailRow}>
            <span style={S.previewDetailLabel}>Checksum (SHA-256)</span>
            <span style={S.previewDetailValue}>{media.checksum || "—"}</span>
          </div>
          <div style={S.previewDetailRow}>
            <span style={S.previewDetailLabel}>Diunggah oleh</span>
            <span style={S.previewDetailValue}>{media.uploaded_by || "—"}</span>
          </div>
          <div style={S.previewDetailRow}>
            <span style={S.previewDetailLabel}>URL File</span>
            <a
              href={media.file_url || media.file}
              target="_blank"
              rel="noreferrer"
              style={S.previewLink}
            >
              Buka di tab baru →
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Confirm Delete ─────────────────────────────────────────
function DeleteConfirm({ media, onConfirm, onCancel, loading }) {
  if (!media) return null
  return (
    <div style={S.previewOverlay}>
      <div style={S.confirmBox}>
        <div style={S.confirmIcon}>
          <TrashIcon size={24} />
        </div>
        <h3 style={S.confirmTitle}>Hapus Media?</h3>
        <p style={S.confirmMsg}>
          <strong style={{ color: "#1A1A18" }}>{media.name}</strong> akan dihapus permanen.
          Jika media ini digunakan dalam playlist, playlist tersebut mungkin bermasalah.
        </p>
        <div style={S.confirmActions}>
          <button style={S.btnGhost} onClick={onCancel}>Batal</button>
          <button
            style={loading ? { ...S.btnDanger, opacity: 0.6 } : S.btnDanger}
            disabled={loading}
            onClick={onConfirm}
          >
            {loading ? "Menghapus…" : "Ya, Hapus"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────
export default function MediaPage() {
  const qc = useQueryClient()
  const [search, setSearch]       = useState("")
  const [typeFilter, setType]     = useState("all")
  const [viewMode, setViewMode]   = useState("grid")
  const [preview, setPreview]     = useState(null)
  const [toDelete, setToDelete]   = useState(null)
  const [uploads, setUploads]     = useState([])

  const { data, isLoading } = useQuery({
    queryKey: ["media"],
    queryFn: fetchMedia,
  })

  const deleteMut = useMutation({
    mutationFn: deleteMedia,
    onSuccess: () => {
      qc.invalidateQueries(["media"])
      setToDelete(null)
    },
  })

  const allMedia = data?.results ?? data ?? []
  const filtered = allMedia.filter(m => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase())
    const matchType   = typeFilter === "all" || m.media_type === typeFilter
    return matchSearch && matchType
  })

  const imageCount = allMedia.filter(m => m.media_type === "image").length
  const videoCount = allMedia.filter(m => m.media_type === "video").length
  const totalSize  = allMedia.reduce((a, m) => a + (m.file_size ?? 0), 0)

  const handleFiles = async (files) => {
    for (const file of files) {
      const uploadId = `${file.name}-${Date.now()}`
      setUploads(prev => [...prev, { id: uploadId, name: file.name, progress: 0 }])

      const formData = new FormData()
      formData.append("file", file)
      formData.append("name", file.name.replace(/\.[^/.]+$/, ""))
      formData.append("media_type", detectType(file))

      try {
        await client.post("/media/", formData, {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (e) => {
            const pct = Math.round((e.loaded / e.total) * 100)
            setUploads(prev =>
              prev.map(u => u.id === uploadId ? { ...u, progress: pct } : u)
            )
          },
        })
        setUploads(prev =>
          prev.map(u => u.id === uploadId ? { ...u, progress: 100, done: true } : u)
        )
        qc.invalidateQueries(["media"])
        setTimeout(() => {
          setUploads(prev => prev.filter(u => u.id !== uploadId))
        }, 3000)
      } catch (err) {
        setUploads(prev =>
          prev.map(u => u.id === uploadId
            ? { ...u, error: "Gagal mengunggah" } : u)
        )
      }
    }
  }

  return (
    <div style={S.page}>
      <style>{ANIM_CSS}</style>

      {/* Header */}
      <div style={S.header}>
        <div>
          <h1 style={S.pageTitle}>Media Library</h1>
          <p style={S.pageSub}>Kelola semua aset media untuk konten kiosk</p>
        </div>
      </div>

      {/* Stats strip */}
      <div style={S.statsStrip}>
        <div style={S.statItem}>
          <span style={S.statValue}>{allMedia.length}</span>
          <span style={S.statLabel}>Total File</span>
        </div>
        <div style={S.statDivider} />
        <div style={S.statItem}>
          <span style={{ ...S.statValue, color: "#7BA3D4" }}>{imageCount}</span>
          <span style={S.statLabel}>Gambar</span>
        </div>
        <div style={S.statDivider} />
        <div style={S.statItem}>
          <span style={{ ...S.statValue, color: "#418840" }}>{videoCount}</span>
          <span style={S.statLabel}>Video</span>
        </div>
        <div style={S.statDivider} />
        <div style={S.statItem}>
          <span style={{ ...S.statValue, color: "#C49A3C" }}>{formatBytes(totalSize)}</span>
          <span style={S.statLabel}>Total Ukuran</span>
        </div>
      </div>

      {/* Upload zone */}
      <UploadZone onFiles={handleFiles} />

      {/* Upload progress queue */}
      {uploads.length > 0 && (
        <div style={S.uploadQueue}>
          {uploads.map(u => (
            <UploadItem
              key={u.id}
              name={u.name}
              progress={u.progress}
              error={u.error}
              done={u.done}
            />
          ))}
        </div>
      )}

      {/* Filters + view toggle */}
      <div style={S.toolbar}>
        <div style={S.toolbarLeft}>
          <div style={S.searchWrap}>
            <svg style={S.searchIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              style={S.searchInput}
              placeholder="Cari nama file…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button style={S.clearBtn} onClick={() => setSearch("")}>✕</button>
            )}
          </div>

          <div style={S.typeFilter}>
            {[
              { key: "all",   label: "Semua",  count: allMedia.length },
              { key: "image", label: "Gambar", count: imageCount },
              { key: "video", label: "Video",  count: videoCount },
            ].map(({ key, label, count }) => (
              <button
                key={key}
                style={typeFilter === key
                  ? { ...S.typeTab, ...S.typeTabActive }
                  : S.typeTab}
                onClick={() => setType(key)}
              >
                {label}
                <span style={typeFilter === key ? S.tabCountActive : S.tabCount}>
                  {count}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div style={S.viewToggle}>
          <button
            style={viewMode === "grid" ? { ...S.viewBtn, ...S.viewBtnActive } : S.viewBtn}
            onClick={() => setViewMode("grid")}
            title="Grid view"
          >
            <GridIcon />
          </button>
          <button
            style={viewMode === "list" ? { ...S.viewBtn, ...S.viewBtnActive } : S.viewBtn}
            onClick={() => setViewMode("list")}
            title="List view"
          >
            <ListIcon />
          </button>
        </div>
      </div>

      {/* Media grid / list */}
      {isLoading ? (
        <div style={S.grid}>
          {[...Array(8)].map((_, i) => (
            <div key={i} style={{ ...S.skeleton, animationDelay: `${i * 0.06}s` }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={S.empty}>
          <ImageIcon size={40} color="#C5BFB8" />
          <p style={S.emptyTitle}>
            {allMedia.length === 0 ? "Belum ada media" : "Tidak ada media yang cocok"}
          </p>
          <p style={S.emptyText}>
            {allMedia.length === 0
              ? "Unggah gambar atau video menggunakan area di atas"
              : "Coba ubah filter pencarian"}
          </p>
        </div>
      ) : viewMode === "grid" ? (
        <div style={S.grid}>
          {filtered.map((m, i) => (
            <MediaCard
              key={m.id}
              media={m}
              index={i}
              onPreview={setPreview}
              onDelete={setToDelete}
            />
          ))}
        </div>
      ) : (
        <div style={S.listWrap}>
          <div style={S.listHeader}>
            {["Nama File", "Tipe", "Ukuran", "Diunggah", ""].map(h => (
              <span key={h} style={S.listHeaderCell}>{h}</span>
            ))}
          </div>
          {filtered.map((m, i) => (
            <div
              key={m.id}
              style={{ ...S.listRow, animationDelay: `${i * 0.03}s` }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(196,191,184,0.2)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <div style={S.listNameCell}>
                <div style={S.listThumb}>
                  {m.media_type === "image" ? (
                    <img src={m.file_url || m.file} alt={m.name} style={S.listThumbImg} />
                  ) : (
                    <div style={S.listThumbVideo}>
                      <FilmIcon size={14} color="#A8A49C" />
                    </div>
                  )}
                </div>
                <span style={S.listName}>{m.name}</span>
              </div>
              <span style={{
                ...S.listTypeBadge,
                background: m.media_type === "image"
                  ? "rgba(42,79,133,0.1)" : "rgba(45,106,79,0.1)",
                color: m.media_type === "image" ? "#7BA3D4" : "#418840",
              }}>
                {m.media_type}
              </span>
              <span style={S.listCell}>{formatBytes(m.file_size)}</span>
              <span style={S.listCell}>{formatDate(m.created_at)}</span>
              <div style={S.listActions}>
                <button style={S.listActionBtn} onClick={() => setPreview(m)}>
                  <EyeIcon />
                </button>
                <button
                  style={{ ...S.listActionBtn, color: "#A8A49C" }}
                  onClick={() => setToDelete(m)}
                  onMouseEnter={e => (e.currentTarget.style.color = "#C0392B")}
                  onMouseLeave={e => (e.currentTarget.style.color = "#A8A49C")}
                >
                  <TrashIcon />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <PreviewModal media={preview} onClose={() => setPreview(null)} />
      <DeleteConfirm
        media={toDelete}
        onConfirm={() => deleteMut.mutate(toDelete.id)}
        onCancel={() => setToDelete(null)}
        loading={deleteMut.isPending}
      />
    </div>
  )
}

// ── Icons ──────────────────────────────────────────────────
function UploadIcon() {
  return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#A8A49C" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
}
function FilmIcon({ size = 16, color = "#A8A49C" }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/></svg>
}
function EyeIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
}
function TrashIcon({ size = 13 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
}
function GridIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
}
function ListIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="3" cy="6" r="1" fill="currentColor"/><circle cx="3" cy="12" r="1" fill="currentColor"/><circle cx="3" cy="18" r="1" fill="currentColor"/></svg>
}
function ImageIcon({ size = 16, color = "#A8A49C" }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
}
function SpinIcon() {
  return <span style={{ display: "inline-block", animation: "spin 0.7s linear infinite", fontSize: "12px" }}>⟳</span>
}

// ── Neuromorphic tokens ────────────────────────────────────
const NM   = "#EDEAE6"
const NM_U = "6px 6px 14px #D0CCCA, -6px -6px 14px #FFFFFF"
const NM_S = "4px 4px 10px #D0CCCA, -4px -4px 10px #FFFFFF"
const NM_I = "inset 4px 4px 10px #D0CCCA, inset -4px -4px 10px #FFFFFF"
const NM_I_SM = "inset 3px 3px 7px #D0CCCA, inset -3px -3px 7px #FFFFFF"

// ── Styles ─────────────────────────────────────────────────
const ANIM_CSS = `
  @keyframes fadeUp  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
  @keyframes slideUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
  @keyframes shimmer { 0%{background-position:-600px 0} 100%{background-position:600px 0} }
  @keyframes spin    { to{transform:rotate(360deg)} }
`

const S = {
  page: {
    fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
    color: "#1A1A18",
    maxWidth: "1400px",
    animation: "fadeUp 0.4s ease both",
  },
  header: { marginBottom: "20px" },
  pageTitle: {
    fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
    fontSize: "26px",
    fontWeight: 600,
    color: "#1A1A18",
    margin: "0 0 4px",
    letterSpacing: "1px",
  },
  pageSub: { fontSize: "13px", color: "#8A8680", margin: 0, fontWeight: 300 },

  // Stats
  statsStrip: {
    display: "flex",
    alignItems: "center",
    background: NM,
    border: "none",
    borderRadius: "12px",
    padding: "14px 24px",
    marginBottom: "20px",
    gap: "0",
    boxShadow: NM_U,
  },
  statItem: {
    display: "flex",
    flexDirection: "column",
    gap: "3px",
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
    fontSize: "22px",
    fontWeight: 600,
    color: "#C49A3C",
    lineHeight: 1,
  },
  statLabel: {
    fontSize: "10px",
    color: "#8A8680",
    textTransform: "uppercase",
    letterSpacing: "0.8px",
    fontWeight: 600,
  },
  statDivider: {
    width: "1px",
    height: "36px",
    background: "#D0CCCA",
    flexShrink: 0,
  },

  // Upload zone
  uploadZone: {
    border: "2px dashed",
    borderRadius: "12px",
    padding: "32px 20px",
    textAlign: "center",
    cursor: "pointer",
    marginBottom: "12px",
    transition: "all 0.2s",
  },
  uploadIcon: { marginBottom: "10px" },
  uploadTitle: {
    fontSize: "14px",
    fontWeight: 600,
    color: "#7A7670",
    margin: "0 0 4px",
  },
  uploadHint: { fontSize: "12px", color: "#8A8680", margin: 0 },

  // Upload queue
  uploadQueue: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    marginBottom: "16px",
  },
  uploadItem: {
    background: NM,
    border: "none",
    borderRadius: "10px",
    padding: "10px 14px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    boxShadow: NM_S,
  },
  uploadItemLeft: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flex: 1,
    minWidth: 0,
  },
  uploadItemIcon: {
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    flexShrink: 0,
    color: "#1A1A18",
  },
  uploadItemName: {
    fontSize: "13px",
    color: "#1A1A18",
    margin: "0 0 2px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    maxWidth: "300px",
  },
  uploadItemStatus: { fontSize: "11px", margin: 0 },
  uploadBar: {
    width: "100px",
    height: "4px",
    background: "#E5E0D8",
    borderRadius: "2px",
    overflow: "hidden",
    flexShrink: 0,
  },
  uploadBarFill: {
    height: "100%",
    background: "linear-gradient(90deg, #2D6A4F, #1b818a)",
    borderRadius: "2px",
    transition: "width 0.3s ease",
  },

  // Toolbar
  toolbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
    gap: "12px",
    flexWrap: "wrap",
  },
  toolbarLeft: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
    flexWrap: "wrap",
  },
  searchWrap: { position: "relative" },
  searchIcon: {
    position: "absolute",
    left: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#A8A49C",
    pointerEvents: "none",
  },
  searchInput: {
    background: NM,
    border: "none",
    borderRadius: "10px",
    padding: "9px 36px",
    fontSize: "13px",
    color: "#1A1A18",
    fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
    outline: "none",
    width: "240px",
    boxShadow: NM_I_SM,
  },
  clearBtn: {
    position: "absolute",
    right: "10px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    color: "#A8A49C",
    cursor: "pointer",
    fontSize: "12px",
    padding: 0,
  },
  typeFilter: { display: "flex", gap: "6px" },
  typeTab: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    background: NM,
    border: "none",
    borderRadius: "20px",
    padding: "6px 14px",
    fontSize: "12px",
    color: "#7A7670",
    cursor: "pointer",
    fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
    transition: "box-shadow 0.18s",
    boxShadow: NM_S,
  },
  typeTabActive: {
    background: NM,
    border: "none",
    color: "#7BA3D4",
    boxShadow: NM_I_SM,
  },
  tabCount: {
    background: "rgba(196,191,184,0.4)",
    borderRadius: "10px",
    padding: "1px 6px",
    fontSize: "10px",
    color: "#8A8680",
  },
  tabCountActive: {
    background: "rgba(42,79,133,0.15)",
    borderRadius: "10px",
    padding: "1px 6px",
    fontSize: "10px",
    color: "#7BA3D4",
  },
  viewToggle: {
    display: "flex",
    gap: "4px",
    background: NM,
    border: "none",
    borderRadius: "10px",
    padding: "4px",
    boxShadow: NM_I_SM,
  },
  viewBtn: {
    background: "transparent",
    border: "none",
    borderRadius: "7px",
    width: "28px",
    height: "28px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#A8A49C",
    cursor: "pointer",
    transition: "all 0.15s",
  },
  viewBtnActive: {
    background: NM,
    color: "#C49A3C",
    boxShadow: NM_S,
  },

  // Grid
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: "16px",
  },
  mediaCard: {
    background: NM,
    border: "none",
    borderRadius: "12px",
    overflow: "hidden",
    animation: "fadeUp 0.35s ease both",
    transition: "box-shadow 0.2s",
    boxShadow: NM_U,
  },
  cardThumb: {
    width: "100%",
    aspectRatio: "16/9",
    background: "#F9F6F1",
    position: "relative",
    overflow: "hidden",
  },
  cardThumbImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  cardThumbVideo: {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    background: "#F0EBE3",
  },
  videoDuration: {
    fontFamily: "'DM Mono', monospace",
    fontSize: "10px",
    color: "#8A8680",
  },
  cardTypeBadge: {
    position: "absolute",
    top: "8px",
    left: "8px",
    fontSize: "9px",
    fontWeight: 700,
    letterSpacing: "1px",
    color: "#FFFFFF",
    borderRadius: "4px",
    padding: "2px 6px",
  },
  cardOverlay: {
    position: "absolute",
    inset: 0,
    background: "rgba(26,26,24,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    animation: "fadeIn 0.15s ease both",
  },
  overlayBtn: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    background: "rgba(255,255,255,0.9)",
    border: "1px solid rgba(255,255,255,0.6)",
    color: "#1A1A18",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.15s",
  },
  overlayBtnDanger: {
    background: "rgba(192,57,43,0.9)",
    border: "1px solid rgba(192,57,43,0.6)",
    color: "#FFFFFF",
  },
  cardInfo: { padding: "10px 12px" },
  cardName: {
    fontSize: "12px",
    fontWeight: 600,
    color: "#1A1A18",
    margin: "0 0 4px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  cardMeta: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    marginBottom: "3px",
  },
  cardMetaItem: { fontSize: "11px", color: "#8A8680" },
  cardMetaDot: { fontSize: "10px", color: "#C5BFB8" },
  cardHash: {
    fontFamily: "'DM Mono', monospace",
    fontSize: "10px",
    color: "#C5BFB8",
    margin: 0,
  },

  // List view
  listWrap: {
    background: NM,
    border: "none",
    borderRadius: "14px",
    overflow: "hidden",
    boxShadow: NM_U,
  },
  listHeader: {
    display: "grid",
    gridTemplateColumns: "2fr 100px 100px 120px 80px",
    padding: "10px 16px",
    background: "rgba(196,191,184,0.18)",
    borderBottom: "1px solid rgba(196,191,184,0.5)",
    gap: "12px",
  },
  listHeaderCell: {
    fontSize: "10px",
    fontWeight: 600,
    color: "#8A8680",
    letterSpacing: "1px",
    textTransform: "uppercase",
  },
  listRow: {
    display: "grid",
    gridTemplateColumns: "2fr 100px 100px 120px 80px",
    padding: "10px 16px",
    borderBottom: "1px solid rgba(196,191,184,0.35)",
    alignItems: "center",
    gap: "12px",
    transition: "background 0.1s",
    animation: "fadeUp 0.3s ease both",
  },
  listNameCell: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    minWidth: 0,
  },
  listThumb: {
    width: "40px",
    height: "28px",
    borderRadius: "4px",
    overflow: "hidden",
    flexShrink: 0,
    background: "#F9F6F1",
  },
  listThumbImg: { width: "100%", height: "100%", objectFit: "cover" },
  listThumbVideo: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#F0EBE3",
  },
  listName: {
    fontSize: "13px",
    color: "#1A1A18",
    fontWeight: 500,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  listTypeBadge: {
    fontSize: "11px",
    borderRadius: "4px",
    padding: "3px 8px",
    fontWeight: 500,
    justifySelf: "start",
  },
  listCell: { fontSize: "12px", color: "#7A7670" },
  listActions: { display: "flex", gap: "6px" },
  listActionBtn: {
    background: "transparent",
    border: "none",
    color: "#7A7670",
    cursor: "pointer",
    padding: "4px",
    display: "flex",
    alignItems: "center",
    transition: "color 0.15s",
  },

  // Preview modal
  previewOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    backdropFilter: "blur(6px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    animation: "fadeIn 0.2s ease both",
    padding: "20px",
  },
  previewBox: {
    background: NM,
    border: "none",
    borderRadius: "16px",
    width: "100%",
    maxWidth: "700px",
    maxHeight: "90vh",
    overflowY: "auto",
    animation: "slideUp 0.25s ease both",
    boxShadow: NM_U,
  },
  previewHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: "20px 24px 16px",
    borderBottom: "1px solid rgba(196,191,184,0.5)",
  },
  previewTitle: {
    fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
    fontSize: "16px",
    color: "#1A1A18",
    margin: "0 0 4px",
    letterSpacing: "0.3px",
  },
  previewMeta: { fontSize: "12px", color: "#7A7670", margin: 0 },
  previewClose: {
    background: "transparent",
    border: "none",
    color: "#8A8680",
    fontSize: "16px",
    cursor: "pointer",
    padding: "4px 8px",
    fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
    flexShrink: 0,
  },
  previewMedia: {
    background: "#F0EBE3",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "200px",
    maxHeight: "400px",
    overflow: "hidden",
  },
  previewImg: {
    maxWidth: "100%",
    maxHeight: "400px",
    objectFit: "contain",
    display: "block",
  },
  previewVideo: { width: "100%", maxHeight: "400px" },
  previewDetails: {
    padding: "16px 24px 20px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  previewDetailRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
  },
  previewDetailLabel: {
    fontSize: "11px",
    color: "#8A8680",
    textTransform: "uppercase",
    letterSpacing: "0.8px",
    fontWeight: 600,
    flexShrink: 0,
  },
  previewDetailValue: {
    fontFamily: "'DM Mono', monospace",
    fontSize: "11px",
    color: "#7A7670",
    wordBreak: "break-all",
    textAlign: "right",
  },
  previewLink: {
    fontSize: "12px",
    color: "#7BA3D4",
    textDecoration: "none",
  },

  // Confirm delete
  confirmBox: {
    background: NM,
    border: "none",
    borderRadius: "16px",
    width: "100%",
    maxWidth: "360px",
    padding: "28px",
    textAlign: "center",
    animation: "slideUp 0.25s ease both",
    boxShadow: NM_U,
  },
  confirmIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    background: "rgba(192,57,43,0.08)",
    border: "1px solid rgba(192,57,43,0.25)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 16px",
    color: "#C0392B",
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
    justifyContent: "center",
  },
  btnGhost: {
    background: NM,
    border: "none",
    borderRadius: "8px",
    padding: "9px 18px",
    fontSize: "13px",
    color: "#7A7670",
    cursor: "pointer",
    fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
    boxShadow: NM_S,
  },
  btnDanger: {
    background: NM,
    border: "none",
    borderRadius: "8px",
    padding: "9px 18px",
    fontSize: "13px",
    color: "#C0392B",
    cursor: "pointer",
    fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
    fontWeight: 600,
    boxShadow: NM_S,
  },

  // Empty & loading
  empty: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "80px 20px",
    gap: "10px",
    textAlign: "center",
  },
  emptyTitle: {
    fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
    fontSize: "16px",
    color: "#7A7670",
    margin: 0,
  },
  emptyText: { fontSize: "13px", color: "#8A8680", margin: 0 },
  skeleton: {
    height: "180px",
    borderRadius: "12px",
    background: "linear-gradient(90deg, #D8D4CF 25%, #E8E4DF 50%, #D8D4CF 75%)",
    backgroundSize: "600px 100%",
    animation: "shimmer 1.4s infinite",
  },
}
