import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import client from "../../api/client"

// ── API ────────────────────────────────────────────────────
const fetchUsers     = () => client.get("/users/").then(r => r.data)
const createUser     = (data) => client.post("/users/", data)
const deactivateUser = (id) => client.post(`/users/${id}/deactivate/`)
const reactivateUser = (id) => client.post(`/users/${id}/activate/`)
const changePassword = (data) => client.post("/users/change-password/", data)

// ── Helpers ────────────────────────────────────────────────
function formatDate(str) {
  if (!str) return "—"
  return new Date(str).toLocaleDateString("id-ID", {
    day: "2-digit", month: "short", year: "numeric",
  })
}
function initials(user) {
  const name = user.first_name || user.username || "?"
  return name.charAt(0).toUpperCase()
}

const ANIM_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600&family=DM+Mono:wght@400&family=DM+Sans:wght@300;400;500;600&display=swap');
  @keyframes fadeUp  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
  @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes shimmer { 0%{background-position:-600px 0} 100%{background-position:600px 0} }
`

// ── Toast ──────────────────────────────────────────────────
function Toast({ msg, type, onClose }) {
  if (!msg) return null
  const isErr = type === "error"
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "10px",
      background: isErr ? "rgba(216,58,47,0.15)" : "rgba(65,136,64,0.15)",
      border: `1px solid ${isErr ? "rgba(216,58,47,0.35)" : "rgba(65,136,64,0.35)"}`,
      color: isErr ? "#f2767c" : "#86ac69",
      borderRadius: "8px", padding: "10px 14px",
      marginBottom: "16px", fontSize: "13px",
      animation: "fadeIn 0.2s ease both",
    }}>
      <span>{isErr ? "✕" : "✓"}</span>
      <span style={{ flex: 1 }}>{msg}</span>
      <button onClick={onClose} style={{
        background: "none", border: "none", color: "inherit",
        cursor: "pointer", padding: "0 4px", opacity: 0.6,
        fontFamily: "'DM Sans', sans-serif",
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
        background: "#1a1a18",
        border: `1px solid ${focused ? "#d5b57e" : "#3a3a36"}`,
        borderRadius: "8px", padding: "10px 13px",
        fontSize: "13px", color: "#fff9eb",
        fontFamily: "'DM Sans', sans-serif", outline: "none",
        width: "100%", boxSizing: "border-box",
        transition: "border-color 0.15s",
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
      <label style={{ fontSize: "11px", fontWeight: 600, color: "#808180", letterSpacing: "0.8px", textTransform: "uppercase" }}>
        {label}{required && <span style={{ color: "#d83a2f", marginLeft: "3px" }}>*</span>}
      </label>
      {children}
      {hint && <p style={{ fontSize: "11px", color: hint.error ? "#f2767c" : "#b98e52", margin: "2px 0 0" }}>{hint.text}</p>}
    </div>
  )
}

// ── Section card ───────────────────────────────────────────
function Section({ title, subtitle, delay = "0s", children }) {
  return (
    <div style={{
      background: "#1e1e1c", border: "1px solid #2e2e2a",
      borderRadius: "12px", overflow: "hidden",
      animation: "fadeUp 0.4s ease both", animationDelay: delay,
    }}>
      <div style={{
        padding: "18px 24px 14px", borderBottom: "1px solid #2e2e2a",
        background: "#1a1a18",
      }}>
        <h2 style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: "12px",
          fontWeight: 600, color: "#808180", letterSpacing: "1.5px",
          textTransform: "uppercase", margin: subtitle ? "0 0 3px" : 0,
        }}>{title}</h2>
        {subtitle && <p style={{ fontSize: "12px", color: "#5a5956", margin: 0, fontWeight: 300 }}>{subtitle}</p>}
      </div>
      <div style={{ padding: "20px 24px" }}>{children}</div>
    </div>
  )
}

// ── Password Section ───────────────────────────────────────
function PasswordForm() {
  const [form, setForm] = useState({ current: "", next: "", confirm: "" })
  const [toast, setToast] = useState({ msg: "", type: "" })
  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

  const showToast = (msg, type) => {
    setToast({ msg, type })
    setTimeout(() => setToast({ msg: "", type: "" }), 4000)
  }

  const mut = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      setForm({ current: "", next: "", confirm: "" })
      showToast("Password berhasil diubah.", "success")
    },
    onError: (err) => {
      showToast(err.response?.data?.detail || "Gagal mengubah password.", "error")
    },
  })

  const mismatch = form.confirm && form.next !== form.confirm
  const valid    = form.current && form.next.length >= 8 && form.next === form.confirm
  const len      = form.next.length
  const score    = len === 0 ? 0 : len < 8 ? 1 : len < 12 ? 2 : len < 16 ? 3 : 4
  const strengthColor = ["", "#d83a2f", "#b98e52", "#7ba3d4", "#86ac69"][score]
  const strengthLabel = ["", "Terlalu pendek", "Cukup", "Kuat", "Sangat kuat"][score]

  return (
    <div>
      {toast.msg && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast({ msg: "", type: "" })} />}

      <Field label="Password Saat Ini" required>
        <Input type="password" value={form.current} onChange={set("current")} placeholder="Masukkan password lama" autoComplete="current-password" />
      </Field>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
        <Field label="Password Baru" required hint={form.next && form.next.length < 8 ? { text: "Minimal 8 karakter" } : null}>
          <Input type="password" value={form.next} onChange={set("next")} placeholder="Minimal 8 karakter" autoComplete="new-password" />
        </Field>
        <Field label="Konfirmasi Password Baru" required hint={mismatch ? { text: "Password tidak cocok", error: true } : null}>
          <Input type="password" value={form.confirm} onChange={set("confirm")} placeholder="Ulangi password baru" autoComplete="new-password" />
        </Field>
      </div>

      {/* Strength bar */}
      {form.next && (
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
          <div style={{ display: "flex", gap: "4px" }}>
            {[0, 1, 2, 3].map(i => (
              <div key={i} style={{
                width: "32px", height: "4px", borderRadius: "2px",
                background: i < score ? strengthColor : "#2e2e2a",
                transition: "background 0.2s",
              }} />
            ))}
          </div>
          <span style={{ fontSize: "11px", color: strengthColor }}>{strengthLabel}</span>
        </div>
      )}

      <button
        style={{
          display: "inline-flex", alignItems: "center",
          background: "linear-gradient(135deg, #2a4f85, #1b818a)",
          border: "none", borderRadius: "8px", padding: "10px 18px",
          fontSize: "13px", fontWeight: 600, color: "#fff9eb",
          cursor: !valid || mut.isPending ? "not-allowed" : "pointer",
          fontFamily: "'DM Sans', sans-serif",
          opacity: !valid || mut.isPending ? 0.5 : 1,
        }}
        disabled={!valid || mut.isPending}
        onClick={() => mut.mutate({ current_password: form.current, new_password: form.next })}
      >
        {mut.isPending ? "Menyimpan…" : "Ubah Password"}
      </button>
    </div>
  )
}

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
      position: "fixed", inset: 0, background: "rgba(10,10,8,0.88)",
      backdropFilter: "blur(5px)", display: "flex", alignItems: "center",
      justifyContent: "center", zIndex: 1000,
      animation: "fadeIn 0.2s ease both", padding: "20px",
    }}>
      <div style={{
        background: "#1e1e1c", border: "1px solid #3a3a36",
        borderRadius: "14px", width: "100%", maxWidth: "500px",
        padding: "24px", animation: "slideUp 0.25s ease both",
        maxHeight: "90vh", overflowY: "auto",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h3 style={{ fontFamily: "'Cinzel', serif", fontSize: "16px", color: "#fff9eb", margin: 0, letterSpacing: "0.5px" }}>
            Tambah Pengguna Baru
          </h3>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "#5a5956", fontSize: "16px", cursor: "pointer", padding: "2px 6px", fontFamily: "'DM Sans', sans-serif" }}>✕</button>
        </div>

        {error && (
          <div style={{ background: "rgba(216,58,47,0.1)", border: "1px solid rgba(216,58,47,0.25)", borderRadius: "7px", padding: "10px 14px", marginBottom: "14px", color: "#f2767c", fontSize: "12px" }}>
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
              style={{ accentColor: "#d5b57e", marginRight: "10px", width: "15px", height: "15px" }}
            />
            <span style={{ fontSize: "13px", color: "#b2a893" }}>Berikan akses staff (dapat mengakses CMS)</span>
          </label>
        </div>

        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ display: "inline-flex", alignItems: "center", background: "transparent", border: "1px solid #3a3a36", borderRadius: "8px", padding: "9px 16px", fontSize: "13px", color: "#808180", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
            Batal
          </button>
          <button
            style={{
              display: "inline-flex", alignItems: "center",
              background: "linear-gradient(135deg, #2a4f85, #1b818a)",
              border: "none", borderRadius: "8px", padding: "10px 18px",
              fontSize: "13px", fontWeight: 600, color: "#fff9eb",
              cursor: !valid || loading ? "not-allowed" : "pointer",
              fontFamily: "'DM Sans', sans-serif",
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
function UserRow({ user, onDeactivate, onReactivate, isActing, index }) {
  const active = user.is_active
  const hue = (user.username.charCodeAt(0) * 37) % 360
  return (
    <div
      style={{
        display: "flex", alignItems: "center", gap: "12px",
        padding: "11px 4px", borderBottom: "1px solid #252522",
        transition: "background 0.1s", borderRadius: "4px",
        margin: "0 -4px",
        animation: "fadeUp 0.35s ease both",
        animationDelay: `${index * 0.04}s`,
      }}
      onMouseEnter={e => e.currentTarget.style.background = "#252522"}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
    >
      {/* Avatar */}
      <div style={{
        width: "34px", height: "34px", borderRadius: "50%",
        background: active
          ? `linear-gradient(135deg, hsl(${hue},40%,28%), hsl(${(hue+40)%360},35%,22%))`
          : "#252522",
        border: "1px solid #2e2e2a",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "13px", fontWeight: 600, color: active ? "#fff9eb" : "#5a5956",
        flexShrink: 0,
      }}>
        {initials(user)}
      </div>

      {/* Name + meta */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
          <span style={{ fontSize: "13px", fontWeight: 600, color: active ? "#fff9eb" : "#5a5956" }}>
            {(user.first_name || user.last_name)
              ? `${user.first_name} ${user.last_name}`.trim()
              : user.username}
          </span>
          {user.is_superuser && (
            <span style={{ fontSize: "9px", background: "rgba(216,58,47,0.15)", border: "1px solid rgba(216,58,47,0.3)", color: "#f2767c", borderRadius: "4px", padding: "1px 6px", fontWeight: 700, letterSpacing: "0.5px" }}>SUPER</span>
          )}
          {user.is_staff && !user.is_superuser && (
            <span style={{ fontSize: "9px", background: "rgba(42,79,133,0.2)", border: "1px solid rgba(42,79,133,0.35)", color: "#7ba3d4", borderRadius: "4px", padding: "1px 6px", fontWeight: 700, letterSpacing: "0.5px" }}>STAFF</span>
          )}
        </div>
        <span style={{ fontSize: "11px", color: "#5a5956" }}>
          @{user.username}{user.email ? ` · ${user.email}` : ""}
        </span>
      </div>

      {/* Dates */}
      <div style={{ display: "flex", flexDirection: "column", gap: "2px", minWidth: "90px" }}>
        <span style={{ fontSize: "9px", color: "#3a3a36", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>Login</span>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "#5a5956" }}>{formatDate(user.last_login)}</span>
      </div>

      {/* Status badge */}
      <span style={active ? {
        fontSize: "11px", background: "rgba(65,136,64,0.15)",
        border: "1px solid rgba(65,136,64,0.3)", color: "#86ac69",
        borderRadius: "20px", padding: "3px 10px",
      } : {
        fontSize: "11px", background: "#252522",
        border: "1px solid #2e2e2a", color: "#5a5956",
        borderRadius: "20px", padding: "3px 10px",
      }}>
        {active ? "Aktif" : "Nonaktif"}
      </span>

      {/* Action */}
      {!user.is_superuser && (
        <button
          disabled={isActing}
          onClick={() => active ? onDeactivate(user.id) : onReactivate(user.id)}
          style={{
            background: active ? "rgba(216,58,47,0.08)" : "rgba(65,136,64,0.08)",
            border: `1px solid ${active ? "rgba(216,58,47,0.3)" : "rgba(65,136,64,0.3)"}`,
            borderRadius: "6px", padding: "5px 12px",
            fontSize: "11px", fontWeight: 600,
            color: active ? "#f2767c" : "#86ac69",
            cursor: isActing ? "not-allowed" : "pointer",
            fontFamily: "'DM Sans', sans-serif",
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
  const [showCreate, setShowCreate] = useState(false)
  const [createError, setCreateError] = useState("")
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

  const createMut = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      qc.invalidateQueries(["users"])
      setShowCreate(false)
      setCreateError("")
      showUserToast("Akun berhasil dibuat.", "success")
    },
    onError: (err) => {
      const d = err.response?.data
      if (d && typeof d === "object") {
        const first = Object.values(d)[0]
        setCreateError(Array.isArray(first) ? first[0] : String(first))
      } else {
        setCreateError("Gagal membuat akun.")
      }
    },
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

  const users        = data?.results ?? data ?? []
  const activeCount  = users.filter(u => u.is_active).length
  const staffCount   = users.filter(u => u.is_staff).length

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", color: "#fff9eb", maxWidth: "1400px", animation: "fadeUp 0.4s ease both" }}>
      <style>{ANIM_CSS}</style>

      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontFamily: "'Cinzel', serif", fontSize: "26px", fontWeight: 600, color: "#fff9eb", margin: "0 0 4px", letterSpacing: "1px" }}>
          Pengaturan
        </h1>
        <p style={{ fontSize: "13px", color: "#808180", margin: 0, fontWeight: 300 }}>
          Kelola akun dan konfigurasi sistem eKiosk
        </p>
      </div>

      {/* Two-column layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "16px", alignItems: "start" }}>

        {/* LEFT */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          <Section title="Ubah Password" subtitle="Ganti password akun yang sedang aktif" delay="0s">
            <PasswordForm />
          </Section>

          <Section title="Informasi Sistem" delay="0.05s">
            {[
              ["Sistem",     "eKiosk CMS"],
              ["Versi",      "1.0.0"],
              ["Framework",  "Django 5.2 + React 18"],
              ["Database",   "PostgreSQL 16"],
              ["Timezone",   "Asia/Makassar (WITA)"],
              ["Lingkungan", "Production"],
            ].map(([label, value]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #252522" }}>
                <span style={{ fontSize: "12px", color: "#5a5956", fontWeight: 500 }}>{label}</span>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "12px", color: "#808180" }}>{value}</span>
              </div>
            ))}
          </Section>

        </div>

        {/* RIGHT */}
        <div>
          <Section title="Manajemen Pengguna" subtitle="Kelola akun staff yang dapat mengakses dashboard CMS" delay="0.08s">

            {/* Stats */}
            <div style={{
              display: "flex", alignItems: "center",
              background: "#1a1a18", border: "1px solid #2e2e2a",
              borderRadius: "8px", padding: "12px 20px",
              marginBottom: "16px",
            }}>
              {[
                { val: users.length, label: "Total",   color: "#d5b57e" },
                null,
                { val: activeCount,  label: "Aktif",   color: "#86ac69" },
                null,
                { val: staffCount,   label: "Staff",   color: "#7ba3d4" },
              ].map((item, i) =>
                item === null ? (
                  <div key={i} style={{ width: "1px", height: "32px", background: "#2e2e2a", flexShrink: 0 }} />
                ) : (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2px", alignItems: "center" }}>
                    <span style={{ fontFamily: "'Cinzel', serif", fontSize: "22px", fontWeight: 600, color: item.color, lineHeight: 1 }}>{item.val}</span>
                    <span style={{ fontSize: "10px", color: "#5a5956", textTransform: "uppercase", letterSpacing: "0.8px", fontWeight: 600 }}>{item.label}</span>
                  </div>
                )
              )}
            </div>

            {/* User toast */}
            {userToast.msg && (
              <Toast msg={userToast.msg} type={userToast.type} onClose={() => setUserToast({ msg: "", type: "" })} />
            )}

            {/* Add user button */}
            <div style={{ marginBottom: "14px" }}>
              <button
                style={{
                  display: "inline-flex", alignItems: "center",
                  background: "linear-gradient(135deg, #2a4f85, #1b818a)",
                  border: "none", borderRadius: "8px", padding: "10px 18px",
                  fontSize: "13px", fontWeight: 600, color: "#fff9eb",
                  cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                  transition: "box-shadow 0.2s",
                }}
                onClick={() => { setShowCreate(true); setCreateError("") }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 6px 20px rgba(27,129,138,0.3)")}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: 6 }}>
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Tambah Pengguna
              </button>
            </div>

            {/* User list */}
            {isLoading ? (
              <div>
                {[...Array(3)].map((_, i) => (
                  <div key={i} style={{
                    height: "52px", borderRadius: "8px", marginBottom: "6px",
                    background: "linear-gradient(90deg, #1e1e1c 25%, #252522 50%, #1e1e1c 75%)",
                    backgroundSize: "600px 100%", animation: "shimmer 1.4s infinite",
                  }} />
                ))}
              </div>
            ) : users.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 20px", gap: "10px" }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3a3a36" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
                <p style={{ fontSize: "13px", color: "#5a5956", margin: 0 }}>Belum ada pengguna terdaftar</p>
              </div>
            ) : (
              <div>
                {users.map((u, i) => (
                  <UserRow
                    key={u.id}
                    user={u}
                    index={i}
                    isActing={actingId === u.id}
                    onDeactivate={deactivateMut.mutate}
                    onReactivate={reactivateMut.mutate}
                  />
                ))}
              </div>
            )}
          </Section>
        </div>
      </div>

      {/* Create modal */}
      {showCreate && (
        <CreateUserModal
          onClose={() => { setShowCreate(false); setCreateError("") }}
          onSubmit={createMut.mutate}
          loading={createMut.isPending}
          error={createError}
        />
      )}
    </div>
  )
}
