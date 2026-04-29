import { getStatusKiosk } from "./tokens"

/** Pill badge for kiosk heartbeat status (operational, stale, …). */
export default function KioskStatusBadge({ status, style }) {
  const cfg = getStatusKiosk(status)
  return (
    <span
      role="status"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        fontSize: "10px",
        fontWeight: 600,
        padding: "3px 10px",
        borderRadius: "20px",
        background: cfg.bg,
        color: cfg.text,
        ...style,
      }}
    >
      <span
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          background: cfg.dot,
          flexShrink: 0,
        }}
        aria-hidden
      />
      {cfg.label}
    </span>
  )
}
