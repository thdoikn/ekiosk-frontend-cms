import { color, depth, font, radius, space, transition } from "./tokens"

/** Summary metric: top accent bar, value, label. */
export default function StatCard({ label, value, color: accent, icon, style }) {
  return (
    <div
      style={{
        background: color.surface,
        border: "none",
        borderTop: `3px solid ${accent}`,
        borderRadius: radius["3xl"],
        padding: space[5],
        boxShadow: depth.raisedSm,
        minWidth: 0,
        transition: `box-shadow ${transition.default}`,
        ...style,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: space[2] }}>
        <span style={{ color: color.textSubtle, display: "flex", alignItems: "center" }}>{icon}</span>
        <span
          style={{
            fontSize: "38px",
            fontWeight: 700,
            lineHeight: 1,
            color: accent,
            fontFamily: font.family,
          }}
        >
          {value}
        </span>
      </div>
      <span
        style={{
          fontSize: font.size.xs,
          color: color.textHint,
          letterSpacing: "1px",
          textTransform: "uppercase",
          fontWeight: 600,
        }}
      >
        {label}
      </span>
    </div>
  )
}
