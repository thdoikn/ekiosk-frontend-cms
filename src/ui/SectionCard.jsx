import { color, depth, font, radius, space, transition } from "./tokens"

/**
 * Neumorphic section with optional title/subtitle; content area below header band.
 */
export default function SectionCard({ title, subtitle, delay = "0s", children, headerStyle, bodyStyle }) {
  return (
    <div
      style={{
        background: color.surface,
        border: "none",
        borderRadius: radius["2xl"],
        overflow: "hidden",
        animation: "civFadeUp 0.4s ease both",
        animationDelay: delay,
        boxShadow: depth.raised,
        transition: `box-shadow ${transition.default}`,
        ...headerStyle,
      }}
    >
      <div
        style={{
          padding: `${space[6]} ${space[7]} ${space[4]}`,
          borderBottom: `1px solid ${color.borderStrong}`,
          background: color.surfaceAlt,
        }}
      >
        <h2
          style={{
            fontFamily: font.family,
            fontSize: font.size.sm,
            fontWeight: font.weight.semibold,
            color: color.textSubtle,
            letterSpacing: font.letter.caps,
            textTransform: "uppercase",
            margin: subtitle ? "0 0 3px" : 0,
          }}
        >
          {title}
        </h2>
        {subtitle && (
          <p style={{ fontSize: font.size.body, color: color.textMuted, margin: 0, fontWeight: 300 }}>{subtitle}</p>
        )}
      </div>
      <div style={{ padding: `${space[5]} ${space[7]}`, ...bodyStyle }}>{children}</div>
    </div>
  )
}
