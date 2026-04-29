import { useState } from "react"
import { color, depth, font, radius, transition } from "./tokens"

const base = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "6px",
  fontFamily: font.family,
  fontSize: font.size.body,
  fontWeight: 600,
  border: "none",
  borderRadius: radius.md,
  padding: "9px 16px",
  cursor: "pointer",
  transition: `opacity ${transition.default}, box-shadow ${transition.default}, filter ${transition.default}`,
  outline: "none",
}

const variants = {
  primary: {
    base: { ...base, background: `linear-gradient(135deg, ${color.brand}, #1b818a)`, color: "#FFFFFF" },
    hover: { filter: "brightness(1.06)" },
  },
  secondary: {
    base: { ...base, background: "transparent", color: color.textSubtle, border: "1px solid #E5E0D8" },
    hover: { opacity: 0.85 },
  },
  danger: {
    base: { ...base, background: color.dangerBg, color: color.danger, border: "1px solid rgba(192,57,43,0.3)" },
    hover: { opacity: 0.9 },
  },
  ghost: {
    base: { ...base, background: color.surface, color: color.textSubtle, boxShadow: depth.raisedSmPress },
    hover: { boxShadow: depth.insetSm },
  },
  soft: {
    base: { ...base, background: color.surface, color: color.textSubtle, fontSize: font.size.sm, fontWeight: 500, padding: "5px 12px", borderRadius: radius.sm, boxShadow: depth.raisedSmPress },
    hover: { boxShadow: depth.insetSm },
  },
}

export default function ActionButton({ variant = "primary", type = "button", disabled, children, onClick, style, title, ...rest }) {
  const cfg = variants[variant] || variants.primary
  const [hover, setHover] = useState(false)
  return (
    <button
      type={type}
      title={title}
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        ...cfg.base,
        ...(!disabled && hover ? cfg.hover : null),
        opacity: disabled ? 0.4 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        boxShadow: cfg.base.boxShadow,
        ...style,
      }}
      onFocus={(e) => { e.currentTarget.style.boxShadow = `0 0 0 2px ${color.bg}, 0 0 0 4px ${color.brand}` }}
      onBlur={(e) => { e.currentTarget.style.boxShadow = cfg.base.boxShadow || "none" }}
      {...rest}
    >
      {children}
    </button>
  )
}
