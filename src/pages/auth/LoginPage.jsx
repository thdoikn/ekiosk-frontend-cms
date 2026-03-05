import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuthStore } from "../../store/authStore"
import axios from "axios"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const login = useAuthStore((s) => s.login)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const res = await axios.post("/api/v1/auth/token/", { username: email, password })
      login(res.data.access, res.data.refresh)
      navigate("/dashboard")
    } catch {
      setError("Invalid credentials. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.root}>
      {/* Ambient background shapes */}
      <div style={styles.bgShape1} />
      <div style={styles.bgShape2} />
      <div style={styles.bgShape3} />

      <div style={styles.container}>
        {/* Left panel — branding */}
        <div style={styles.leftPanel}>
          <div style={styles.brandingInner}>
            <div style={styles.logoMark}>
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <polygon points="24,4 44,14 44,34 24,44 4,34 4,14" fill="none" stroke="#d5b57e" strokeWidth="2" />
                <polygon points="24,10 38,17 38,31 24,38 10,31 10,17" fill="none" stroke="#d5b57e" strokeOpacity="0.5" strokeWidth="1" />
                <circle cx="24" cy="24" r="6" fill="#d5b57e" />
              </svg>
            </div>
            <div style={styles.brandText}>
              <span style={styles.brandSub}>OTORITA IBU KOTA NUSANTARA</span>
              <h1 style={styles.brandTitle}>eKiosk</h1>
              <span style={styles.brandSub2}>Content Management System</span>
            </div>

            <div style={styles.divider} />

            <div style={styles.featureList}>
              {["Manage digital signage across IKN", "Monitor kiosk health in real-time", "Deploy content by region instantly"].map((f, i) => (
                <div key={i} style={styles.featureItem}>
                  <span style={styles.featureDot} />
                  <span style={styles.featureText}>{f}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={styles.leftFooter}>
            <span style={styles.leftFooterText}>© 2025 Otorita IKN · Semua Hak Dilindungi</span>
          </div>
        </div>

        {/* Right panel — login form */}
        <div style={styles.rightPanel}>
          <div style={styles.formCard}>
            <div style={styles.formHeader}>
              <h2 style={styles.formTitle}>Selamat Datang</h2>
              <p style={styles.formSubtitle}>Masuk ke panel pengelolaan eKiosk</p>
            </div>

            {error && (
              <div style={styles.errorBox}>
                <span style={styles.errorIcon}>!</span>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Username</label>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Masukkan username"
                  required
                  style={styles.input}
                  onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
                  onBlur={(e) => Object.assign(e.target.style, styles.input)}
                />
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  required
                  style={styles.input}
                  onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
                  onBlur={(e) => Object.assign(e.target.style, styles.input)}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={loading ? { ...styles.submitBtn, ...styles.submitBtnDisabled } : styles.submitBtn}
                onMouseEnter={(e) => !loading && Object.assign(e.target.style, styles.submitBtnHover)}
                onMouseLeave={(e) => !loading && Object.assign(e.target.style, styles.submitBtn)}
              >
                {loading ? (
                  <span style={styles.loadingRow}>
                    <span style={styles.spinner} />
                    Memproses...
                  </span>
                ) : "Masuk"}
              </button>
            </form>

            <div style={styles.formFooter}>
              <span style={styles.formFooterText}>
                Hubungi administrator jika lupa kata sandi
              </span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes floatShape {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
      `}</style>
    </div>
  )
}

const styles = {
  root: {
    minHeight: "100vh",
    background: "#232320",
    display: "flex",
    alignItems: "stretch",
    position: "relative",
    overflow: "hidden",
    fontFamily: "'DM Sans', sans-serif",
  },
  bgShape1: {
    position: "absolute",
    top: "-120px",
    right: "-120px",
    width: "500px",
    height: "500px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(42,79,133,0.25) 0%, transparent 70%)",
    pointerEvents: "none",
    animation: "floatShape 8s ease-in-out infinite",
  },
  bgShape2: {
    position: "absolute",
    bottom: "-80px",
    left: "30%",
    width: "400px",
    height: "400px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(97,138,72,0.15) 0%, transparent 70%)",
    pointerEvents: "none",
    animation: "floatShape 11s ease-in-out infinite reverse",
  },
  bgShape3: {
    position: "absolute",
    top: "40%",
    left: "-100px",
    width: "300px",
    height: "300px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(216,58,47,0.12) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  container: {
    display: "flex",
    width: "100%",
    minHeight: "100vh",
    position: "relative",
    zIndex: 1,
  },
  leftPanel: {
    flex: "0 0 45%",
    background: "linear-gradient(155deg, #2a4f85 0%, #175085 40%, #1b818a 100%)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: "60px 56px",
    position: "relative",
    overflow: "hidden",
  },
  brandingInner: {
    animation: "fadeUp 0.7s ease both",
  },
  logoMark: {
    marginBottom: "28px",
  },
  brandText: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  brandSub: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: "10px",
    letterSpacing: "3px",
    color: "rgba(213,181,126,0.8)",
    textTransform: "uppercase",
    fontWeight: 500,
  },
  brandTitle: {
    fontFamily: "'Cinzel', serif",
    fontSize: "64px",
    fontWeight: 700,
    color: "#fff9eb",
    margin: "8px 0 4px",
    lineHeight: 1,
    letterSpacing: "2px",
  },
  brandSub2: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: "13px",
    color: "rgba(255,249,235,0.6)",
    letterSpacing: "1px",
    fontWeight: 300,
  },
  divider: {
    width: "48px",
    height: "2px",
    background: "linear-gradient(90deg, #d5b57e, transparent)",
    margin: "40px 0",
  },
  featureList: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },
  featureItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: "14px",
  },
  featureDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "#d5b57e",
    marginTop: "7px",
    flexShrink: 0,
  },
  featureText: {
    fontSize: "14px",
    color: "rgba(255,249,235,0.75)",
    lineHeight: 1.6,
    fontWeight: 300,
  },
  leftFooter: {
    marginTop: "auto",
  },
  leftFooterText: {
    fontSize: "11px",
    color: "rgba(255,249,235,0.35)",
    letterSpacing: "0.5px",
  },
  rightPanel: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px",
    background: "#2b2b27",
  },
  formCard: {
    width: "100%",
    maxWidth: "400px",
    animation: "fadeUp 0.7s ease 0.15s both",
  },
  formHeader: {
    marginBottom: "36px",
  },
  formTitle: {
    fontFamily: "'Cinzel', serif",
    fontSize: "28px",
    fontWeight: 600,
    color: "#fff9eb",
    margin: "0 0 8px",
    letterSpacing: "1px",
  },
  formSubtitle: {
    fontSize: "14px",
    color: "#808180",
    margin: 0,
    fontWeight: 300,
  },
  errorBox: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "rgba(216,58,47,0.12)",
    border: "1px solid rgba(216,58,47,0.3)",
    borderRadius: "8px",
    padding: "12px 16px",
    marginBottom: "24px",
    color: "#f2767c",
    fontSize: "13px",
  },
  errorIcon: {
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    background: "rgba(216,58,47,0.3)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "11px",
    fontWeight: 700,
    flexShrink: 0,
    textAlign: "center",
    lineHeight: "20px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  label: {
    fontSize: "12px",
    fontWeight: 500,
    color: "#b2a893",
    letterSpacing: "0.5px",
    textTransform: "uppercase",
  },
  input: {
    background: "#1e1e1c",
    border: "1px solid #3a3a36",
    borderRadius: "8px",
    padding: "13px 16px",
    fontSize: "14px",
    color: "#fff9eb",
    outline: "none",
    transition: "border-color 0.2s",
    fontFamily: "'DM Sans', sans-serif",
    width: "100%",
    boxSizing: "border-box",
  },
  inputFocus: {
    background: "#1e1e1c",
    border: "1px solid #d5b57e",
    borderRadius: "8px",
    padding: "13px 16px",
    fontSize: "14px",
    color: "#fff9eb",
    outline: "none",
    transition: "border-color 0.2s",
    fontFamily: "'DM Sans', sans-serif",
    width: "100%",
    boxSizing: "border-box",
  },
  submitBtn: {
    marginTop: "8px",
    background: "linear-gradient(135deg, #2a4f85, #1b818a)",
    border: "none",
    borderRadius: "8px",
    padding: "14px",
    fontSize: "14px",
    fontWeight: 600,
    color: "#fff9eb",
    cursor: "pointer",
    transition: "all 0.2s",
    fontFamily: "'DM Sans', sans-serif",
    letterSpacing: "0.5px",
  },
  submitBtnHover: {
    marginTop: "8px",
    background: "linear-gradient(135deg, #175085, #17898b)",
    border: "none",
    borderRadius: "8px",
    padding: "14px",
    fontSize: "14px",
    fontWeight: 600,
    color: "#fff9eb",
    cursor: "pointer",
    transition: "all 0.2s",
    fontFamily: "'DM Sans', sans-serif",
    letterSpacing: "0.5px",
    transform: "translateY(-1px)",
    boxShadow: "0 8px 24px rgba(27,129,138,0.3)",
  },
  submitBtnDisabled: {
    opacity: 0.6,
    cursor: "not-allowed",
    transform: "none",
    boxShadow: "none",
  },
  loadingRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
  },
  spinner: {
    width: "14px",
    height: "14px",
    border: "2px solid rgba(255,249,235,0.3)",
    borderTopColor: "#fff9eb",
    borderRadius: "50%",
    display: "inline-block",
    animation: "spin 0.7s linear infinite",
  },
  formFooter: {
    marginTop: "24px",
    textAlign: "center",
  },
  formFooterText: {
    fontSize: "12px",
    color: "#5a5956",
  },
}
