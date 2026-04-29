import { color, font, space } from "./tokens"
import ActionButton from "./ActionButton"

export default function EmptyState({ icon, title, actionLabel, onAction, children }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "40px 20px",
        gap: space[2],
        fontFamily: font.family,
      }}
    >
      {icon && (
        <span style={{ fontSize: "32px", color: color.textHint, lineHeight: 1 }} aria-hidden>
          {icon}
        </span>
      )}
      <p style={{ fontSize: font.size.body, color: color.textMuted, margin: 0, textAlign: "center" }}>{title}</p>
      {actionLabel && onAction && (
        <ActionButton variant="soft" onClick={onAction} type="button">
          {actionLabel}
        </ActionButton>
      )}
      {children}
    </div>
  )
}
