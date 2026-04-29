import { color, depth, font } from "./tokens"

/**
 * In-page “no access” for staff-gated content (replaces ad-hoc copies).
 */
export default function PermissionState({ pageTitle }) {
  return (
    <div
      style={{
        width: "100%",
        minHeight: "calc(100vh - 128px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: font.family,
        color: color.text,
        animation: "civFadeUp 0.4s ease both",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "520px",
          background: color.surface,
          borderRadius: "18px",
          padding: "34px 36px",
          textAlign: "center",
          boxShadow: depth.raised,
        }}
      >
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "18px",
            margin: "0 auto 18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: color.accent,
            background: color.surface,
            boxShadow: depth.inset,
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
        </div>
        {pageTitle && (
          <span
            style={{
              fontSize: "11px",
              color: color.textMuted,
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              fontWeight: 700,
            }}
          >
            {pageTitle}
          </span>
        )}
        <h1
          style={{
            fontSize: "24px",
            fontWeight: 700,
            margin: "10px 0 8px",
            color: color.textStrong,
          }}
        >
          Anda tidak memiliki izin
        </h1>
        <p
          style={{
            fontSize: "13px",
            lineHeight: 1.7,
            color: color.textSubtle,
            margin: 0,
          }}
        >
          Akun Anda dapat membuka menu ini, tetapi belum memiliki akses staff untuk melihat data di halaman ini.
          Hubungi superadmin jika Anda membutuhkan akses.
        </p>
      </div>
    </div>
  )
}