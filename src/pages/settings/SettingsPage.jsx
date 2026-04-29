import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import client from "../../api/client"
import { useAuthStore } from "../../store/authStore"
import { PageHeader, SectionCard, LoadingSkeleton, EmptyState, color, depth, font } from "../../ui"

// ── API ────────────────────────────────────────────────────
const fetchUsers     = () => client.get("/users/").then(r => r.data)
const deactivateUser = (id) => client.post(`/users/${id}/deactivate/`)
const reactivateUser = (id) => client.post(`/users/${id}/activate/`)

// ── Helpers ────────────────────────────────────────────────
function formatDateTime(str) {
  if (!str) return "—"
  return new Date(str).toLocaleString("id-ID", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}
function toTitleCase(str) {
  if (!str) return ""
  return str.replace(/\S+/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
}
function displayName(user) {
  const full = `${user.first_name || ""} ${user.last_name || ""}`.trim()
  return full ? toTitleCase(full) : user.username
}
function initials(user) {
  return displayName(user).charAt(0).toUpperCase()
}
function roleRank(u) {
  if (u.is_superuser) return 0
  if (u.is_staff)     return 1
  return 2
}

// Keyframes: civFadeIn / civSlideUp / civFadeUp / civShimmer (injected globally via AppLayout)

// ── Toast ──────────────────────────────────────────────────
function Toast({ msg, type, onClose }) {
  if (!msg) return null
  const isErr = type === "error"
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "10px",
      background: isErr ? "rgba(192,57,43,0.08)" : "rgba(45,106,79,0.08)",
      border: `1px solid ${isErr ? "rgba(192,57,43,0.3)" : "rgba(45,106,79,0.3)"}`,
      color: isErr ? "#C0392B" : "#418840",
      borderRadius: "8px", padding: "10px 14px",
      marginBottom: "16px", fontSize: "13px",
      animation: "civFadeIn 0.2s ease both",
    }}>
      <span>{isErr ? "✕" : "✓"}</span>
      <span style={{ flex: 1 }}>{msg}</span>
      <button onClick={onClose} style={{
        background: "none", border: "none", color: "inherit",
        cursor: "pointer", padding: "0 4px", opacity: 0.6,
        fontFamily: font.family,
      }}>✕</button>
    </div>
  )
}

// ── Controlled input ───────────────────────────────────────
function Input({ value, onChange, type = "text", placeholder, disabled, autoComplete }) {
  const [focused, setFocused] = useState(false)
  return (
    <input
      type={type} value={value} onChange={onChange}
      placeholder={placeholder} disabled={disabled}
      autoComplete={autoComplete}
      style={{
        background: color.surface,
        border: "none",
        borderRadius: "10px", padding: "10px 13px",
        fontSize: "13px", color: color.text,
        fontFamily: font.family, outline: "none",
        width: "100%", boxSizing: "border-box",
        boxShadow: focused ? depth.insetFocus : depth.insetSm,
        transition: "box-shadow 0.18s",
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? "not-allowed" : "text",
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  )
}

function Field({ label, required, hint, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "7px", marginBottom: "14px" }}>
      <label style={{ fontSize: "11px", fontWeight: 600, color: "#7A7670", letterSpacing: "0.8px", textTransform: "uppercase" }}>
        {label}{required && <span style={{ color: "#C0392B", marginLeft: "3px" }}>*</span>}
      </label>
      {children}
      {hint && <p style={{ fontSize: "11px", color: hint.error ? "#C0392B" : "#9B7228", margin: "2px 0 0" }}>{hint.text}</p>}
    </div>
  )
}

// Section layout: `SectionCard` from `../../ui`

// ── Create User Modal ──────────────────────────────────────
function CreateUserModal({ onClose, onSubmit, loading, error }) {
  const [form, setForm] = useState({
    username: "", first_name: "", last_name: "",
    email: "", password: "", is_staff: true,
  })
  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))
  const valid = form.username && form.password.length >= 8

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
      backdropFilter: "blur(5px)", display: "flex", alignItems: "center",
      justifyContent: "center", zIndex: 1000,
      animation: "civFadeIn 0.2s ease both", padding: "20px",
    }}>
      <div style={{
        background: color.surface, border: "none",
        borderRadius: "16px", width: "100%", maxWidth: "500px",
        padding: "24px", animation: "civSlideUp 0.25s ease both",
        maxHeight: "90vh", overflowY: "auto",
        boxShadow: depth.raised,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h3 style={{ fontFamily: font.family, fontSize: "16px", color: color.text, margin: 0, letterSpacing: "0.5px" }}>
            Tambah Pengguna Baru
          </h3>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: color.textMuted, fontSize: "16px", cursor: "pointer", padding: "2px 6px", fontFamily: font.family }}>✕</button>
        </div>

        {error && (
          <div style={{ background: "rgba(192,57,43,0.08)", border: "1px solid rgba(192,57,43,0.3)", borderRadius: "7px", padding: "10px 14px", marginBottom: "14px", color: "#C0392B", fontSize: "12px" }}>
            {error}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
          <Field label="Username" required>
            <Input value={form.username} onChange={set("username")} placeholder="cth. budi.santoso" autoComplete="off" />
          </Field>
          <Field label="Email">
            <Input type="email" value={form.email} onChange={set("email")} placeholder="cth. budi@ikn.go.id" autoComplete="off" />
          </Field>
          <Field label="Nama Depan">
            <Input value={form.first_name} onChange={set("first_name")} placeholder="Budi" />
          </Field>
          <Field label="Nama Belakang">
            <Input value={form.last_name} onChange={set("last_name")} placeholder="Santoso" />
          </Field>
        </div>

        <Field label="Password" required hint={form.password && form.password.length < 8 ? { text: "Minimal 8 karakter" } : null}>
          <Input type="password" value={form.password} onChange={set("password")} placeholder="Minimal 8 karakter" autoComplete="new-password" />
        </Field>

        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={form.is_staff}
              onChange={e => setForm(p => ({ ...p, is_staff: e.target.checked }))}
              style={{ accentColor: "#2D6A4F", marginRight: "10px", width: "15px", height: "15px" }}
            />
            <span style={{ fontSize: "13px", color: "#7A7670" }}>Berikan akses staff (dapat mengakses CMS)</span>
          </label>
        </div>

        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ display: "inline-flex", alignItems: "center", background: "transparent", border: `1px solid ${color.borderStrong}`, borderRadius: "8px", padding: "9px 16px", fontSize: "13px", color: color.textSubtle, cursor: "pointer", fontFamily: font.family }} type="button">
            Batal
          </button>
          <button
            type="button"
            style={{
              display: "inline-flex", alignItems: "center",
              background: "linear-gradient(135deg, #2D6A4F, #1b818a)",
              border: "none", borderRadius: "8px", padding: "10px 18px",
              fontSize: "13px", fontWeight: 600, color: "#FFFFFF",
              cursor: !valid || loading ? "not-allowed" : "pointer",
              fontFamily: font.family,
              opacity: !valid || loading ? 0.5 : 1,
            }}
            disabled={!valid || loading}
            onClick={() => onSubmit(form)}
          >
            {loading ? "Membuat…" : "Buat Akun"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── User Row ───────────────────────────────────────────────
function UserRow({ user, onDeactivate, onReactivate, isActing, index, canManageUsers }) {
  const active = user.is_active
  const hue = (user.username.charCodeAt(0) * 37) % 360
  return (
    <div
      style={{
        display: "flex", alignItems: "center", gap: "12px",
        padding: "11px 4px", borderBottom: "1px solid rgba(196,191,184,0.45)",
        transition: "background 0.1s", borderRadius: "4px",
        margin: "0 -4px",
        animation: "civFadeUp 0.35s ease both",
        animationDelay: `${index * 0.04}s`,
      }}
      onMouseEnter={e => e.currentTarget.style.background = "rgba(196,191,184,0.2)"}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
    >
      {/* Avatar */}
      <div style={{
        width: "34px", height: "34px", borderRadius: "50%",
        background: active
          ? `linear-gradient(135deg, hsl(${hue},50%,55%), hsl(${(hue+40)%360},45%,50%))`
          : "#F0EBE3",
        border: "1px solid #E5E0D8",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "13px", fontWeight: 600, color: active ? "#FFFFFF" : "#A8A49C",
        flexShrink: 0,
      }}>
        {initials(user)}
      </div>

      {/* Name + meta */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
          <span style={{ fontSize: "13px", fontWeight: 600, color: active ? "#1A1A18" : "#8A8680" }}>
            {displayName(user)}
          </span>
          {user.is_superuser && (
            <span style={{ fontSize: "9px", background: "rgba(192,57,43,0.08)", border: "1px solid rgba(192,57,43,0.3)", color: "#C0392B", borderRadius: "4px", padding: "1px 6px", fontWeight: 700, letterSpacing: "0.5px" }}>SUPERADMIN</span>
          )}
          {user.is_staff && !user.is_superuser && (
            <span style={{ fontSize: "9px", background: "rgba(42,79,133,0.12)", border: "1px solid rgba(42,79,133,0.35)", color: "#7BA3D4", borderRadius: "4px", padding: "1px 6px", fontWeight: 700, letterSpacing: "0.5px" }}>STAFF</span>
          )}
        </div>
        <span style={{ fontSize: "11px", color: "#8A8680" }}>
          @{user.username}{user.email ? ` · ${user.email}` : ""}
        </span>
      </div>

      {/* Dates */}
      <div style={{ display: "flex", flexDirection: "column", gap: "2px", minWidth: "90px" }}>
        <span style={{ fontSize: "9px", color: "#A8A49C", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>Login Terakhir</span>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "#8A8680" }}>{formatDateTime(user.last_login)}</span>
      </div>

      {/* Status badge */}
      <span style={active ? {
        fontSize: "11px", background: "rgba(65,136,64,0.1)",
        border: "1px solid rgba(65,136,64,0.3)", color: "#418840",
        borderRadius: "20px", padding: "3px 10px",
      } : {
        fontSize: "11px", background: "#F0EBE3",
        border: "1px solid #E5E0D8", color: "#8A8680",
        borderRadius: "20px", padding: "3px 10px",
      }}>
        {active ? "Aktif" : "Nonaktif"}
      </span>

      {/* Action */}
      {canManageUsers && !user.is_superuser && (
        <button
          disabled={isActing}
          onClick={() => active ? onDeactivate(user.id) : onReactivate(user.id)}
          style={{
            background: active ? "rgba(192,57,43,0.08)" : "rgba(45,106,79,0.06)",
            border: `1px solid ${active ? "rgba(192,57,43,0.3)" : "rgba(45,106,79,0.3)"}`,
            borderRadius: "6px", padding: "5px 12px",
            fontSize: "11px", fontWeight: 600,
            color: active ? "#C0392B" : "#418840",
            cursor: isActing ? "not-allowed" : "pointer",
            fontFamily: font.family,
            opacity: isActing ? 0.5 : 1,
            whiteSpace: "nowrap",
          }}
        >
          {isActing ? "…" : active ? "Nonaktifkan" : "Aktifkan"}
        </button>
      )}
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────
export default function SettingsPage() {
  const qc = useQueryClient()
  const currentUser = useAuthStore((s) => s.user)
  const [actingId, setActingId] = useState(null)
  const [userToast, setUserToast] = useState({ msg: "", type: "" })

  const showUserToast = (msg, type) => {
    setUserToast({ msg, type })
    setTimeout(() => setUserToast({ msg: "", type: "" }), 4000)
  }

  const { data, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
  })

  const deactivateMut = useMutation({
    mutationFn: deactivateUser,
    onMutate: (id) => setActingId(id),
    onSuccess: () => { qc.invalidateQueries(["users"]); setActingId(null); showUserToast("Akun dinonaktifkan.", "success") },
    onError: () => { setActingId(null); showUserToast("Gagal menonaktifkan akun.", "error") },
  })

  const reactivateMut = useMutation({
    mutationFn: reactivateUser,
    onMutate: (id) => setActingId(id),
    onSuccess: () => { qc.invalidateQueries(["users"]); setActingId(null); showUserToast("Akun diaktifkan kembali.", "success") },
    onError: () => { setActingId(null); showUserToast("Gagal mengaktifkan akun.", "error") },
  })

  const users        = [...(data?.results ?? data ?? [])].sort((a, b) => roleRank(a) - roleRank(b))
  const activeCount  = users.filter(u => u.is_active).length
  const staffCount   = users.filter(u => u.is_staff).length
  const canManageUsers = Boolean(currentUser?.is_superuser)

  return (
    <div style={{ fontFamily: font.family, color: color.text, width: "100%", animation: "civFadeUp 0.4s ease both" }}>

      <PageHeader
        title="Pengaturan"
        subtitle="Kelola akun dan konfigurasi sistem eKiosk"
        style={{ marginBottom: 28 }}
      />

      {/* Two-column layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "16px", alignItems: "start" }}>

        {/* LEFT */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          <SectionCard title="Informasi Sistem" subtitle="Ringkasan konfigurasi aplikasi dan lingkungan server" delay="0s">
            {[
              ["Sistem",     "eKiosk CMS"],
              ["Versi",      "1.0.0"],
              ["Framework",  "Django 5.2 + React 18"],
              ["Database",   "PostgreSQL 16"],
              ["Timezone",   "Asia/Makassar (WITA)"],
              ["Lingkungan", "Production"],
            ].map(([label, value]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid rgba(196,191,184,0.45)" }}>
                <span style={{ fontSize: "12px", color: "#8A8680", fontWeight: 500 }}>{label}</span>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "12px", color: "#7A7670" }}>{value}</span>
              </div>
            ))}
          </SectionCard>

        </div>

        {/* RIGHT */}
        <div>
          <SectionCard title="Manajemen Pengguna" subtitle="Kelola akun staff yang dapat mengakses dashboard CMS" delay="0.08s">

            {/* Stats */}
            <div style={{
              display: "flex", alignItems: "center",
              background: color.surface, border: "none",
              borderRadius: "12px", padding: "12px 20px",
              marginBottom: "16px",
              boxShadow: depth.insetSm,
            }}>
              {[
                { val: users.length, label: "Total",   color: "#C49A3C" },
                null,
                { val: activeCount,  label: "Aktif",   color: "#418840" },
                null,
                { val: staffCount,   label: "Staff",   color: "#7BA3D4" },
              ].map((item, i) =>
                item === null ? (
                  <div key={i} style={{ width: "1px", height: "32px", background: "#D0CCCA", flexShrink: 0 }} />
                ) : (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2px", alignItems: "center" }}>
                    <span style={{ fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif", fontSize: "22px", fontWeight: 600, color: item.color, lineHeight: 1 }}>{item.val}</span>
                    <span style={{ fontSize: "10px", color: "#8A8680", textTransform: "uppercase", letterSpacing: "0.8px", fontWeight: 600 }}>{item.label}</span>
                  </div>
                )
              )}
            </div>

            {/* User toast */}
            {userToast.msg && (
              <Toast msg={userToast.msg} type={userToast.type} onClose={() => setUserToast({ msg: "", type: "" })} />
            )}

            {/* User list */}
            {isLoading ? (
              <LoadingSkeleton rows={3} rowHeight={52} gap={6} />
            ) : users.length === 0 ? (
              <EmptyState icon="👤" title="Belum ada pengguna terdaftar">
                <p style={{ fontSize: 12, color: color.textMuted, margin: 0, textAlign: "center", maxWidth: 360 }}>
                  Tambahkan pengguna baru melalui aksi di atas bila Anda memiliki akses.
                </p>
              </EmptyState>
            ) : (
              <div>
                {users.map((u, i) => (
                  <UserRow
                    key={u.id}
                    user={u}
                    index={i}
                    isActing={actingId === u.id}
                    canManageUsers={canManageUsers}
                    onDeactivate={deactivateMut.mutate}
                    onReactivate={reactivateMut.mutate}
                  />
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      </div>

    </div>
  )
}
