import { color, font, space } from "./tokens"

/**
 * Standard page title + optional subtitle; optional right slot for actions.
 */
export default function PageHeader({ title, subtitle, children, style }) {
  return (
    <div
      style={{
        marginBottom: space[8],
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: space[5],
        flexWrap: "wrap",
        animation: "civFadeUp 0.4s ease both",
        ...style,
      }}
    >
      <div>
        <h1
          style={{
            fontFamily: font.family,
            fontSize: font.size.page,
            fontWeight: font.weight.semibold,
            color: color.textStrong,
            margin: "0 0 4px",
            letterSpacing: "1px",
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            style={{
              fontSize: font.size.body,
              color: color.textMuted,
              margin: 0,
              fontWeight: font.weight.regular,
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
      {children}
    </div>
  )
}
