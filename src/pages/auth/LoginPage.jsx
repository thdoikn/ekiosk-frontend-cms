import { useEffect, useState } from "react"
import { buildAuthorizationUrl, isSsoEnabled } from "../../utils/oidc"

export default function LoginPage() {
  const [autoRedirecting, setAutoRedirecting] = useState(false)

  const isLoggedOut = new URLSearchParams(window.location.search).has("logged_out")

  useEffect(() => {
    if (!isSsoEnabled() || isLoggedOut) return
    // Auto-redirect to Keycloak if the user has an active session there
    setAutoRedirecting(true)
    const t = setTimeout(() => {
      window.location.href = buildAuthorizationUrl()
    }, 800) // small delay so the page renders before redirect
    return () => clearTimeout(t)
  }, [isLoggedOut])

  function handleSso() {
    window.location.href = buildAuthorizationUrl()
  }

  return (
    <div style={s.root}>
      <div style={s.bgShape1} />
      <div style={s.bgShape2} />
      <div style={s.bgShape3} />

      <div style={s.container}>
        {/* Left — branding */}
        <div style={s.left}>
          <div style={s.leftInner}>
            <div style={s.logoMark}>
              <svg width="52" height="52" viewBox="0 0 48 48" fill="none">
                <polygon points="24,4 44,14 44,34 24,44 4,34 4,14" fill="none" stroke="#d5b57e" strokeWidth="2" />
                <polygon points="24,10 38,17 38,31 24,38 10,31 10,17" fill="none" stroke="#d5b57e" strokeOpacity="0.4" strokeWidth="1" />
                <circle cx="24" cy="24" r="6" fill="#d5b57e" />
              </svg>
            </div>
            <div style={s.brandBlock}>
              <span style={s.brandOrg}>OTORITA IBU KOTA NUSANTARA</span>
              <h1 style={s.brandTitle}>eKiosk</h1>
              <span style={s.brandSub}>Content Management System</span>
            </div>
            <div style={s.divider} />
            <div style={s.features}>
              {[
                "Kelola konten digital kiosk IKN",
                "Pantau kesehatan kiosk secara real-time",
                "Distribusi konten per wilayah secara instan",
              ].map((f, i) => (
                <div key={i} style={s.featureRow}>
                  <span style={s.featureDot} />
                  <span style={s.featureText}>{f}</span>
                </div>
              ))}
            </div>
          </div>
          <span style={s.leftFooter}>© 2025 Otorita IKN · Semua Hak Dilindungi</span>
        </div>

        {/* Right — SSO */}
        <div style={s.right}>
          <div style={s.card}>
            {autoRedirecting ? (
              <div style={s.redirecting}>
                <div style={s.redirectSpinner} />
                <p style={s.redirectTitle}>Mengalihkan ke Portal SSO</p>
                <p style={s.redirectSub}>Mohon tunggu sebentar…</p>
              </div>
            ) : (
              <>
                <div style={s.cardHeader}>
                  <div style={s.ssoIcon}>
                    <ShieldIcon />
                  </div>
                  <h2 style={s.cardTitle}>Masuk ke eKiosk</h2>
                  <p style={s.cardSub}>
                    Akses diberikan melalui portal SSO<br />
                    Otorita Ibu Kota Nusantara
                  </p>
                </div>

                <button
                  onClick={handleSso}
                  style={s.ssoBtn}
                  onMouseEnter={e => Object.assign(e.currentTarget.style, s.ssoBtnHover)}
                  onMouseLeave={e => Object.assign(e.currentTarget.style, s.ssoBtn)}
                >
                  <KeyIcon />
                  <span>Masuk dengan SSO</span>
                  <ArrowIcon />
                </button>

                <div style={s.hint}>
                  <span style={s.hintDot} />
                  <span style={s.hintText}>
                    Anda akan diarahkan ke portal autentikasi IKN
                  </span>
                </div>
              </>
            )}
          </div>

          <p style={s.rightFooter}>
            Hubungi administrator jika mengalami kesulitan masuk
          </p>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes fadeUp  { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
        @keyframes float   { 0%,100% { transform:translateY(0) rotate(0deg); } 50% { transform:translateY(-18px) rotate(4deg); } }
        @keyframes pulse   { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
      `}</style>
    </div>
  )
}

/* ── Icons ─────────────────────────────────────────── */
function ShieldIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  )
}
function KeyIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="15" r="4" />
      <line x1="11.5" y1="11.5" x2="20" y2="3" />
      <line x1="18" y1="5" x2="20" y2="7" />
      <line x1="15" y1="8" x2="17" y2="6" />
    </svg>
  )
}
function ArrowIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  )
}

/* ── Styles ─────────────────────────────────────────── */
const s = {
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
    position: "absolute", top: "-120px", right: "-120px",
    width: "500px", height: "500px", borderRadius: "50%",
    background: "radial-gradient(circle, rgba(42,79,133,0.22) 0%, transparent 70%)",
    pointerEvents: "none", animation: "float 8s ease-in-out infinite",
  },
  bgShape2: {
    position: "absolute", bottom: "-80px", left: "30%",
    width: "400px", height: "400px", borderRadius: "50%",
    background: "radial-gradient(circle, rgba(97,138,72,0.13) 0%, transparent 70%)",
    pointerEvents: "none", animation: "float 11s ease-in-out infinite reverse",
  },
  bgShape3: {
    position: "absolute", top: "40%", left: "-100px",
    width: "300px", height: "300px", borderRadius: "50%",
    background: "radial-gradient(circle, rgba(216,58,47,0.1) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  container: {
    display: "flex", width: "100%", minHeight: "100vh",
    position: "relative", zIndex: 1,
  },

  /* Left panel */
  left: {
    flex: "0 0 45%",
    background: "linear-gradient(155deg, #2a4f85 0%, #175085 40%, #1b818a 100%)",
    display: "flex", flexDirection: "column",
    justifyContent: "space-between",
    padding: "60px 56px",
    position: "relative", overflow: "hidden",
  },
  leftInner: { animation: "fadeUp 0.7s ease both" },
  logoMark: { marginBottom: "28px" },
  brandBlock: { display: "flex", flexDirection: "column", gap: "4px" },
  brandOrg: {
    fontSize: "10px", letterSpacing: "3px",
    color: "rgba(213,181,126,0.8)", textTransform: "uppercase", fontWeight: 500,
  },
  brandTitle: {
    fontFamily: "'Cinzel', serif", fontSize: "64px", fontWeight: 700,
    color: "#fff9eb", margin: "8px 0 4px", lineHeight: 1, letterSpacing: "2px",
  },
  brandSub: {
    fontSize: "13px", color: "rgba(255,249,235,0.6)", letterSpacing: "1px", fontWeight: 300,
  },
  divider: {
    width: "48px", height: "2px",
    background: "linear-gradient(90deg, #d5b57e, transparent)",
    margin: "40px 0",
  },
  features: { display: "flex", flexDirection: "column", gap: "18px" },
  featureRow: { display: "flex", alignItems: "flex-start", gap: "14px" },
  featureDot: {
    width: "6px", height: "6px", borderRadius: "50%",
    background: "#d5b57e", marginTop: "7px", flexShrink: 0,
  },
  featureText: { fontSize: "14px", color: "rgba(255,249,235,0.75)", lineHeight: 1.6, fontWeight: 300 },
  leftFooter: { fontSize: "11px", color: "rgba(255,249,235,0.3)", letterSpacing: "0.5px" },

  /* Right panel */
  right: {
    flex: 1, display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    padding: "40px", background: "#2b2b27", gap: "20px",
  },
  card: {
    width: "100%", maxWidth: "380px",
    animation: "fadeUp 0.7s ease 0.12s both",
  },

  /* Card header */
  cardHeader: { textAlign: "center", marginBottom: "36px" },
  ssoIcon: {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    width: "64px", height: "64px", borderRadius: "20px",
    background: "linear-gradient(135deg, rgba(42,79,133,0.3), rgba(27,129,138,0.3))",
    border: "1px solid rgba(213,181,126,0.2)",
    color: "#d5b57e", marginBottom: "20px",
  },
  cardTitle: {
    fontFamily: "'Cinzel', serif", fontSize: "24px", fontWeight: 600,
    color: "#fff9eb", margin: "0 0 10px", letterSpacing: "1px",
  },
  cardSub: {
    fontSize: "13px", color: "#808180", margin: 0,
    fontWeight: 300, lineHeight: 1.7,
  },

  /* SSO button */
  ssoBtn: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    gap: "12px", width: "100%", boxSizing: "border-box",
    background: "linear-gradient(135deg, #2a4f85, #1b818a)",
    border: "none", borderRadius: "12px",
    padding: "16px 20px",
    fontSize: "15px", fontWeight: 600,
    color: "#fff9eb", cursor: "pointer",
    transition: "all 0.2s",
    fontFamily: "'DM Sans', sans-serif",
    letterSpacing: "0.3px",
    boxShadow: "0 4px 20px rgba(27,129,138,0.25)",
  },
  ssoBtnHover: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    gap: "12px", width: "100%", boxSizing: "border-box",
    background: "linear-gradient(135deg, #175085, #17898b)",
    border: "none", borderRadius: "12px",
    padding: "16px 20px",
    fontSize: "15px", fontWeight: 600,
    color: "#fff9eb", cursor: "pointer",
    transition: "all 0.2s",
    fontFamily: "'DM Sans', sans-serif",
    letterSpacing: "0.3px",
    boxShadow: "0 8px 32px rgba(27,129,138,0.4)",
    transform: "translateY(-1px)",
  },

  /* Hint */
  hint: {
    display: "flex", alignItems: "center", gap: "8px",
    marginTop: "16px", justifyContent: "center",
  },
  hintDot: {
    width: "6px", height: "6px", borderRadius: "50%",
    background: "#418840", flexShrink: 0,
    animation: "pulse 2s ease infinite",
    display: "inline-block",
  },
  hintText: { fontSize: "12px", color: "#5a5956" },

  /* Auto-redirect state */
  redirecting: {
    display: "flex", flexDirection: "column",
    alignItems: "center", gap: "16px", padding: "40px 0",
  },
  redirectSpinner: {
    width: "44px", height: "44px",
    border: "3px solid rgba(213,181,126,0.15)",
    borderTopColor: "#d5b57e",
    borderRadius: "50%",
    animation: "spin 0.9s linear infinite",
  },
  redirectTitle: {
    fontSize: "16px", fontWeight: 600,
    color: "#fff9eb", margin: 0,
  },
  redirectSub: {
    fontSize: "13px", color: "#5a5956", margin: 0, fontWeight: 300,
  },

  /* Footer */
  rightFooter: { fontSize: "12px", color: "#3a3a36", textAlign: "center" },
}
