import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useParams, useNavigate } from "react-router-dom"
import {
  DndContext, closestCenter, PointerSensor,
  useSensor, useSensors, DragOverlay,
} from "@dnd-kit/core"
import {
  SortableContext, verticalListSortingStrategy,
  useSortable, arrayMove,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import client from "../../api/client"

// ── API ────────────────────────────────────────────────────
const fetchPlaylist = (id) => client.get(`/playlists/${id}/`).then(r => r.data)
const fetchMedia    = ()    => client.get("/media/").then(r => r.data)
const addItem       = ({ playlistId, mediaId, duration, order }) =>
  client.post(`/playlists/${playlistId}/items/`, {
    media_id: mediaId,
    duration_seconds: duration,
    order,
  })
const removeItem   = ({ playlistId, itemId }) =>
  client.delete(`/playlists/${playlistId}/items/${itemId}/`)
const reorderItems = ({ playlistId, items }) =>
  client.post(`/playlists/${playlistId}/reorder-items/`, { items })
const updateItem   = ({ playlistId, itemId, duration }) =>
  client.patch(`/playlists/${playlistId}/items/${itemId}/`, { duration_seconds: duration })

// ── Icons ──────────────────────────────────────────────────
function FilmIcon({ size = 16, color = "#808180" }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/></svg>
}
function DragIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="6" r="1" fill="currentColor"/><circle cx="9" cy="12" r="1" fill="currentColor"/><circle cx="9" cy="18" r="1" fill="currentColor"/><circle cx="15" cy="6" r="1" fill="currentColor"/><circle cx="15" cy="12" r="1" fill="currentColor"/><circle cx="15" cy="18" r="1" fill="currentColor"/></svg>
}
function CloseIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
}

// ── Animation CSS ──────────────────────────────────────────
const ANIM_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600&family=DM+Mono:wght@400&family=DM+Sans:wght@300;400;500;600&display=swap');
  @keyframes fadeUp  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes shimmer { 0%{background-position:-600px 0} 100%{background-position:600px 0} }
`

// ── Sortable playlist item ─────────────────────────────────
function SortableItem({ item, index, onRemove, onDurationChange }) {
  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging,
  } = useSortable({ id: item.id })

  return (
    <div
      ref={setNodeRef}
      style={{
        ...S.sortableItem,
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
      }}
    >
      <div {...attributes} {...listeners} style={S.dragHandle}>
        <DragIcon />
      </div>

      <div style={S.orderBadge}>{index + 1}</div>

      <div style={S.itemThumb}>
        {item.media.media_type === "image" ? (
          <img
            src={item.media.file_url || item.media.file}
            alt={item.media.name}
            style={S.thumbImg}
          />
        ) : (
          <div style={S.videoThumb}>
            <FilmIcon size={20} color="#5a5956" />
          </div>
        )}
        <span style={{
          ...S.typeChip,
          background: item.media.media_type === "image"
            ? "rgba(42,79,133,0.3)" : "rgba(97,138,72,0.3)",
          color: item.media.media_type === "image" ? "#7ba3d4" : "#86ac69",
        }}>
          {item.media.media_type}
        </span>
      </div>

      <div style={S.itemInfo}>
        <span style={S.itemName}>{item.media.name}</span>
        <span style={S.itemSize}>
          {item.media.file_size
            ? `${(item.media.file_size / 1e6).toFixed(1)} MB`
            : ""}
        </span>
      </div>

      <div style={S.durationWrap}>
        <input
          type="number"
          min="1"
          max="300"
          value={item.duration_seconds}
          onChange={e => onDurationChange(item.id, parseInt(e.target.value) || 1)}
          style={S.durationInput}
        />
        <span style={S.durationUnit}>dtk</span>
      </div>

      <button
        style={S.removeBtn}
        onClick={() => onRemove(item.id)}
        title="Hapus dari playlist"
        onMouseEnter={e => (e.currentTarget.style.color = "#f2767c")}
        onMouseLeave={e => (e.currentTarget.style.color = "#5a5956")}
      >
        <CloseIcon />
      </button>
    </div>
  )
}

// ── Media library item ─────────────────────────────────────
function MediaLibItem({ media, onAdd, isInPlaylist }) {
  return (
    <div
      style={{
        ...S.mediaLibItem,
        opacity: isInPlaylist ? 0.5 : 1,
        cursor: isInPlaylist ? "default" : "pointer",
      }}
      onMouseEnter={e => !isInPlaylist && (e.currentTarget.style.background = "#252522")}
      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
    >
      <div style={S.mediaLibThumb}>
        {media.media_type === "image" ? (
          <img
            src={media.file_url || media.file}
            alt={media.name}
            style={S.mediaLibImg}
          />
        ) : (
          <div style={S.mediaLibVideo}>
            <FilmIcon size={16} color="#5a5956" />
          </div>
        )}
      </div>

      <div style={S.mediaLibInfo}>
        <span style={S.mediaLibName}>{media.name}</span>
        <span style={S.mediaLibMeta}>
          {media.media_type} · {media.file_size
            ? `${(media.file_size / 1e6).toFixed(1)}MB`
            : "—"}
        </span>
      </div>

      <button
        style={isInPlaylist ? S.addedBtn : S.addBtn}
        disabled={isInPlaylist}
        onClick={() => !isInPlaylist && onAdd(media)}
      >
        {isInPlaylist ? "✓" : "+"}
      </button>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────
export default function PlaylistBuilderPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [activeId, setActiveId]       = useState(null)
  const [localItems, setLocalItems]   = useState(null)
  const [mediaSearch, setMediaSearch] = useState("")
  const [mediaFilter, setMediaFilter] = useState("all")
  const [saving, setSaving]           = useState(false)
  const [saveMsg, setSaveMsg]         = useState("")

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const { data: playlist, isLoading: plLoading } = useQuery({
    queryKey: ["playlist", id],
    queryFn: () => fetchPlaylist(id),
    onSuccess: (data) => {
      // always sync from server, but only if no local edits are pending
      // (addMut and removeMut keep localItems in sync themselves,
      //  so we only reset here on fresh page load i.e. localItems is null)
      setLocalItems(prev => prev === null ? (data.items ?? []) : prev)
    },
  })

  const { data: mediaData, isLoading: mediaLoading } = useQuery({
    queryKey: ["media"],
    queryFn: fetchMedia,
  })

  const items    = localItems ?? playlist?.items ?? []
  const allMedia = mediaData?.results ?? mediaData ?? []

  const filteredMedia = allMedia.filter(m => {
    const matchSearch = m.name.toLowerCase().includes(mediaSearch.toLowerCase())
    const matchType   = mediaFilter === "all" || m.media_type === mediaFilter
    return matchSearch && matchType
  })

  const inPlaylistIds = new Set(items.map(i => i.media.id))

  const addMut = useMutation({
    mutationFn: addItem,
    onSuccess: (res, vars) => {
      // use full media object from already-loaded media library
      // so thumbnail, file_url, etc. are all present
      const fullMedia = allMedia.find(m => m.id === vars.mediaId)
      const newItem = {
        ...res.data,
        media: fullMedia ?? res.data.media,
      }
      setLocalItems(prev => [...(prev ?? []), newItem])
    },
  })

  const removeMut = useMutation({
    mutationFn: removeItem,
    onSuccess: (_, vars) => {
      setLocalItems(prev => (prev ?? []).filter(i => i.id !== vars.itemId))
      // qc.invalidateQueries(["playlist", id])
    },
  })

  const handleDragStart = (event) => setActiveId(event.active.id)

  const handleDragEnd = (event) => {
    const { active, over } = event
    setActiveId(null)
    if (!over || active.id === over.id) return
    setLocalItems(prev => {
      const oldIdx = prev.findIndex(i => i.id === active.id)
      const newIdx = prev.findIndex(i => i.id === over.id)
      return arrayMove(prev, oldIdx, newIdx)
    })
  }

  const handleAddMedia = (media) => {
    const nextOrder = items.length + 1
    const duration  = media.media_type === "video"
      ? (media.duration_seconds ?? 30)
      : 10
    addMut.mutate({ playlistId: id, mediaId: media.id, duration, order: nextOrder })
  }

  const handleRemoveItem = (itemId) => {
    removeMut.mutate({ playlistId: id, itemId })
  }

  const handleDurationChange = (itemId, val) => {
    setLocalItems(prev =>
      prev.map(i => i.id === itemId ? { ...i, duration_seconds: val } : i)
    )
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveMsg("")
    try {
      await reorderItems({
        playlistId: id,
        items: items.map((item, idx) => ({ id: item.id, order: idx + 1 })),
      })
      await Promise.all(
        items.map(item =>
          updateItem({ playlistId: id, itemId: item.id, duration: item.duration_seconds })
        )
      )
      await qc.invalidateQueries(["playlist", id])
      setSaveMsg("Tersimpan!")
      setTimeout(() => setSaveMsg(""), 2500)
    } catch {
      setSaveMsg("Gagal menyimpan.")
    } finally {
      setSaving(false)
    }
  }

  const totalDuration = items.reduce((acc, i) => acc + (i.duration_seconds ?? 0), 0)
  const activeItem    = items.find(i => i.id === activeId)

  if (plLoading) {
    return (
      <div style={S.page}>
        <style>{ANIM_CSS}</style>
        <div style={S.loadingGrid}>
          {[...Array(4)].map((_, i) => <div key={i} style={S.skeleton} />)}
        </div>
      </div>
    )
  }

  return (
    <div style={S.page}>
      <style>{ANIM_CSS}</style>

      {/* Top bar */}
      <div style={S.topBar}>
        <div style={S.topLeft}>
          <button style={S.backBtn} onClick={() => navigate("/playlists")}>
            ← Kembali
          </button>
          <div style={S.titleArea}>
            <h1 style={S.pageTitle}>{playlist?.name ?? "Playlist Builder"}</h1>
            <div style={S.titleMeta}>
              <span style={S.metaChip}>{items.length} item</span>
              <span style={S.metaChip}>
                {Math.floor(totalDuration / 60)}m {totalDuration % 60}s total
              </span>
              {playlist?.region && (
                <span style={S.regionChip}>{playlist.region.name}</span>
              )}
            </div>
          </div>
        </div>
        <div style={S.topRight}>
          {saveMsg && (
            <span style={{
              ...S.saveMsg,
              color: saveMsg === "Tersimpan!" ? "#86ac69" : "#f2767c",
            }}>
              {saveMsg}
            </span>
          )}
          <button
            style={saving ? { ...S.saveBtn, opacity: 0.6 } : S.saveBtn}
            disabled={saving}
            onClick={handleSave}
            onMouseEnter={e => !saving && (e.currentTarget.style.boxShadow = "0 6px 20px rgba(27,129,138,0.3)")}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}
          >
            {saving ? "Menyimpan…" : "Simpan Urutan & Durasi"}
          </button>
        </div>
      </div>

      {/* Hash bar */}
      {playlist?.hash && (
        <div style={S.hashBar}>
          <span style={S.hashLabel}>Hash Playlist:</span>
          <span style={S.hashValue}>{playlist.hash}</span>
        </div>
      )}

      {/* Two-panel layout */}
      <div style={S.panels}>

        {/* LEFT: Sequence */}
        <div style={S.leftPanel}>
          <div style={S.panelHeader}>
            <h2 style={S.panelTitle}>Urutan Tayangan</h2>
            <span style={S.panelHint}>Seret untuk mengubah urutan</span>
          </div>

          {items.length === 0 ? (
            <div style={S.emptySequence}>
              <div style={S.emptySequenceIcon}>▶</div>
              <p style={S.emptySequenceText}>
                Belum ada media. Tambahkan dari library di sebelah kanan.
              </p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={items.map(i => i.id)}
                strategy={verticalListSortingStrategy}
              >
                <div style={S.sequenceList}>
                  {items.map((item, idx) => (
                    <SortableItem
                      key={item.id}
                      item={item}
                      index={idx}
                      onRemove={handleRemoveItem}
                      onDurationChange={handleDurationChange}
                    />
                  ))}
                </div>
              </SortableContext>

              <DragOverlay>
                {activeItem && (
                  <div style={{
                    ...S.sortableItem,
                    boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
                    opacity: 0.95,
                    margin: "0 8px",
                  }}>
                    <div style={S.orderBadge}>·</div>
                    <div style={S.itemThumb}>
                      {activeItem.media.media_type === "image" ? (
                        <img
                          src={activeItem.media.file_url || activeItem.media.file}
                          style={S.thumbImg}
                          alt=""
                        />
                      ) : (
                        <div style={S.videoThumb}>
                          <FilmIcon size={20} color="#5a5956" />
                        </div>
                      )}
                    </div>
                    <div style={S.itemInfo}>
                      <span style={S.itemName}>{activeItem.media.name}</span>
                    </div>
                  </div>
                )}
              </DragOverlay>
            </DndContext>
          )}

          {/* Timeline */}
          {items.length > 0 && (
            <div style={S.timeline}>
              <div style={S.timelineLabel}>Preview Timeline</div>
              <div style={S.timelineTrack}>
                {items.map((item, i) => {
                  const pct   = (item.duration_seconds / totalDuration) * 100
                  const color = item.media.media_type === "image"
                    ? `hsl(${210 + i * 20}, 60%, ${40 + i * 5}%)`
                    : `hsl(${130 + i * 15}, 50%, ${35 + i * 5}%)`
                  return (
                    <div
                      key={item.id}
                      style={{ ...S.timelineSegment, width: `${pct}%`, background: color }}
                      title={`${item.media.name} · ${item.duration_seconds}s`}
                    />
                  )
                })}
              </div>
              <div style={S.timelineLabels}>
                <span>0s</span>
                <span>{totalDuration}s</span>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Media library */}
        <div style={S.rightPanel}>
          <div style={S.panelHeader}>
            <h2 style={S.panelTitle}>Media Library</h2>
            <span style={S.panelCount}>{filteredMedia.length} file</span>
          </div>

          <div style={S.libFilters}>
            <div style={S.libSearchWrap}>
              <svg style={S.libSearchIcon} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                style={S.libSearch}
                placeholder="Cari media…"
                value={mediaSearch}
                onChange={e => setMediaSearch(e.target.value)}
              />
            </div>
            <div style={S.libTypeFilter}>
              {["all", "image", "video"].map(t => (
                <button
                  key={t}
                  style={mediaFilter === t
                    ? { ...S.typeTab, ...S.typeTabActive }
                    : S.typeTab}
                  onClick={() => setMediaFilter(t)}
                >
                  {t === "all" ? "Semua" : t === "image" ? "Gambar" : "Video"}
                </button>
              ))}
            </div>
          </div>

          {mediaLoading ? (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {[...Array(5)].map((_, i) => (
                <div key={i} style={S.mediaSkeleton} />
              ))}
            </div>
          ) : filteredMedia.length === 0 ? (
            <div style={S.libEmpty}>
              <p style={{ color: "#5a5956", fontSize: "13px", margin: 0 }}>
                {allMedia.length === 0
                  ? "Belum ada media. Upload di halaman Media."
                  : "Tidak ada media yang cocok."}
              </p>
            </div>
          ) : (
            <div style={S.mediaLibList}>
              {filteredMedia.map(m => (
                <MediaLibItem
                  key={m.id}
                  media={m}
                  onAdd={handleAddMedia}
                  isInPlaylist={inPlaylistIds.has(m.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Styles ─────────────────────────────────────────────────
const S = {
  page: {
    fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
    color: "#fff9eb",
    maxWidth: "1400px",
    animation: "fadeUp 0.35s ease both",
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "16px",
    flexWrap: "wrap",
    gap: "12px",
  },
  topLeft: { display: "flex", alignItems: "flex-start", gap: "16px" },
  topRight: { display: "flex", alignItems: "center", gap: "12px" },
  backBtn: {
    background: "transparent",
    border: "1px solid #2e2e2a",
    borderRadius: "6px",
    padding: "7px 14px",
    fontSize: "13px",
    color: "#808180",
    cursor: "pointer",
    fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
    flexShrink: 0,
    marginTop: "4px",
  },
  titleArea: { display: "flex", flexDirection: "column", gap: "6px" },
  pageTitle: {
    fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
    fontSize: "22px",
    fontWeight: 600,
    color: "#fff9eb",
    margin: 0,
    letterSpacing: "0.5px",
  },
  titleMeta: { display: "flex", gap: "8px", flexWrap: "wrap" },
  metaChip: {
    fontSize: "11px",
    background: "#252522",
    border: "1px solid #2e2e2a",
    borderRadius: "20px",
    padding: "3px 10px",
    color: "#808180",
  },
  regionChip: {
    fontSize: "11px",
    background: "rgba(42,79,133,0.2)",
    border: "1px solid rgba(42,79,133,0.3)",
    borderRadius: "20px",
    padding: "3px 10px",
    color: "#7ba3d4",
  },
  saveBtn: {
    background: "linear-gradient(135deg, #2a4f85, #1b818a)",
    border: "none",
    borderRadius: "8px",
    padding: "10px 20px",
    fontSize: "13px",
    fontWeight: 600,
    color: "#fff9eb",
    cursor: "pointer",
    fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
    transition: "box-shadow 0.2s",
    whiteSpace: "nowrap",
  },
  saveMsg: { fontSize: "13px", fontWeight: 500 },
  hashBar: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "#1a1a18",
    border: "1px solid #2e2e2a",
    borderRadius: "8px",
    padding: "9px 14px",
    marginBottom: "16px",
  },
  hashLabel: {
    fontSize: "10px",
    color: "#5a5956",
    textTransform: "uppercase",
    letterSpacing: "1px",
    fontWeight: 600,
    flexShrink: 0,
  },
  hashValue: {
    fontFamily: "'DM Mono', monospace",
    fontSize: "11px",
    color: "#808180",
    wordBreak: "break-all",
  },
  panels: {
    display: "grid",
    gridTemplateColumns: "1fr 360px",
    gap: "16px",
    alignItems: "start",
  },
  leftPanel: {
    background: "#1e1e1c",
    border: "1px solid #2e2e2a",
    borderRadius: "12px",
    overflow: "hidden",
  },
  rightPanel: {
    background: "#1e1e1c",
    border: "1px solid #2e2e2a",
    borderRadius: "12px",
    overflow: "hidden",
    position: "sticky",
    top: "16px",
  },
  panelHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 20px",
    borderBottom: "1px solid #2e2e2a",
    background: "#1a1a18",
  },
  panelTitle: {
    fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
    fontSize: "12px",
    fontWeight: 600,
    color: "#808180",
    letterSpacing: "1.5px",
    textTransform: "uppercase",
    margin: 0,
  },
  panelHint: { fontSize: "11px", color: "#3a3a36" },
  panelCount: { fontSize: "12px", color: "#5a5956" },

  // Sequence
  sequenceList: {
    display: "flex",
    flexDirection: "column",
    padding: "8px",
    gap: "6px",
  },
  sortableItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "#252522",
    border: "1px solid #2e2e2a",
    borderRadius: "8px",
    padding: "8px 10px",
    userSelect: "none",
  },
  dragHandle: {
    color: "#3a3a36",
    cursor: "grab",
    flexShrink: 0,
    padding: "4px",
    touchAction: "none",
  },
  orderBadge: {
    width: "22px",
    height: "22px",
    borderRadius: "50%",
    background: "#1e1e1c",
    border: "1px solid #2e2e2a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "11px",
    color: "#5a5956",
    fontFamily: "'DM Mono', monospace",
    flexShrink: 0,
  },
  itemThumb: {
    width: "52px",
    height: "36px",
    borderRadius: "6px",
    overflow: "hidden",
    flexShrink: 0,
    position: "relative",
    background: "#1e1e1c",
  },
  thumbImg: { width: "100%", height: "100%", objectFit: "cover" },
  videoThumb: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#1a1a18",
  },
  typeChip: {
    position: "absolute",
    bottom: "2px",
    right: "2px",
    fontSize: "9px",
    borderRadius: "3px",
    padding: "1px 4px",
    fontWeight: 600,
    lineHeight: 1.4,
  },
  itemInfo: { flex: 1, minWidth: 0 },
  itemName: {
    fontSize: "13px",
    color: "#fff9eb",
    fontWeight: 500,
    display: "block",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  itemSize: {
    fontSize: "11px",
    color: "#5a5956",
    display: "block",
    marginTop: "2px",
  },
  durationWrap: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    flexShrink: 0,
  },
  durationInput: {
    width: "52px",
    background: "#1a1a18",
    border: "1px solid #3a3a36",
    borderRadius: "6px",
    padding: "5px 8px",
    fontSize: "12px",
    color: "#d5b57e",
    fontFamily: "'DM Mono', monospace",
    outline: "none",
    textAlign: "center",
  },
  durationUnit: { fontSize: "11px", color: "#5a5956", flexShrink: 0 },
  removeBtn: {
    background: "transparent",
    border: "none",
    color: "#5a5956",
    cursor: "pointer",
    padding: "4px",
    transition: "color 0.15s",
    flexShrink: 0,
  },

  // Empty sequence
  emptySequence: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "60px 20px",
    gap: "12px",
    textAlign: "center",
  },
  emptySequenceIcon: { fontSize: "36px", color: "#2e2e2a" },
  emptySequenceText: {
    fontSize: "13px",
    color: "#5a5956",
    lineHeight: 1.6,
    maxWidth: "280px",
    margin: 0,
  },

  // Timeline
  timeline: {
    padding: "14px 20px 16px",
    borderTop: "1px solid #2e2e2a",
    background: "#1a1a18",
  },
  timelineLabel: {
    fontSize: "10px",
    color: "#5a5956",
    textTransform: "uppercase",
    letterSpacing: "1px",
    marginBottom: "8px",
    fontWeight: 600,
  },
  timelineTrack: {
    display: "flex",
    height: "10px",
    borderRadius: "5px",
    overflow: "hidden",
    background: "#252522",
    gap: "1px",
  },
  timelineSegment: {
    height: "100%",
    transition: "width 0.3s ease",
    minWidth: "2px",
  },
  timelineLabels: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "4px",
    fontSize: "10px",
    color: "#3a3a36",
    fontFamily: "'DM Mono', monospace",
  },

  // Media library
  libFilters: {
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    borderBottom: "1px solid #2e2e2a",
  },
  libSearchWrap: { position: "relative" },
  libSearchIcon: {
    position: "absolute",
    left: "10px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#5a5956",
    pointerEvents: "none",
  },
  libSearch: {
    width: "100%",
    background: "#1a1a18",
    border: "1px solid #2e2e2a",
    borderRadius: "7px",
    padding: "8px 10px 8px 30px",
    fontSize: "12px",
    color: "#fff9eb",
    fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
    outline: "none",
    boxSizing: "border-box",
  },
  libTypeFilter: { display: "flex", gap: "4px" },
  typeTab: {
    flex: 1,
    background: "transparent",
    border: "1px solid #2e2e2a",
    borderRadius: "6px",
    padding: "5px",
    fontSize: "11px",
    color: "#808180",
    cursor: "pointer",
    fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
    transition: "all 0.15s",
  },
  typeTabActive: {
    background: "rgba(42,79,133,0.2)",
    border: "1px solid rgba(42,79,133,0.4)",
    color: "#7ba3d4",
  },
  mediaLibList: {
    display: "flex",
    flexDirection: "column",
    maxHeight: "520px",
    overflowY: "auto",
  },
  mediaLibItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "10px 12px",
    borderBottom: "1px solid #252522",
    transition: "background 0.1s",
  },
  mediaLibThumb: {
    width: "44px",
    height: "32px",
    borderRadius: "5px",
    overflow: "hidden",
    flexShrink: 0,
    background: "#1a1a18",
  },
  mediaLibImg: { width: "100%", height: "100%", objectFit: "cover" },
  mediaLibVideo: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  mediaLibInfo: { flex: 1, minWidth: 0 },
  mediaLibName: {
    fontSize: "12px",
    color: "#fff9eb",
    fontWeight: 500,
    display: "block",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  mediaLibMeta: {
    fontSize: "10px",
    color: "#5a5956",
    display: "block",
    marginTop: "2px",
  },
  addBtn: {
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    background: "rgba(42,79,133,0.2)",
    border: "1px solid rgba(42,79,133,0.4)",
    color: "#7ba3d4",
    fontSize: "16px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
    lineHeight: 1,
    transition: "all 0.15s",
  },
  addedBtn: {
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    background: "rgba(65,136,64,0.15)",
    border: "1px solid rgba(65,136,64,0.3)",
    color: "#86ac69",
    fontSize: "14px",
    cursor: "default",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
    lineHeight: 1,
  },
  libEmpty: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 20px",
  },
  mediaSkeleton: {
    height: "54px",
    background: "linear-gradient(90deg, #1e1e1c 25%, #252522 50%, #1e1e1c 75%)",
    backgroundSize: "600px 100%",
    animation: "shimmer 1.4s infinite",
  },

  // Loading
  loadingGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 360px",
    gap: "16px",
  },
  skeleton: {
    height: "400px",
    borderRadius: "12px",
    background: "linear-gradient(90deg, #1e1e1c 25%, #252522 50%, #1e1e1c 75%)",
    backgroundSize: "600px 100%",
    animation: "shimmer 1.4s infinite",
  },
}
