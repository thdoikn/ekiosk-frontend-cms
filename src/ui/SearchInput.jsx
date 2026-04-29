import { useState } from "react"
import { color, depth, font, radius, transition } from "./tokens"

/**
 * Inset neumorphic search field with optional clear.
 */
export default function SearchInput({
  value,
  onChange,
  placeholder,
  onClear,
  showClear = true,
  style,
  inputStyle,
  "aria-label": ariaLabel = "Cari",
}) {
  const [focused, setFocused] = useState(false)

  return (
    <div
      style={{
        position: "relative",
        flex: "1 1 280px",
        minWidth: 0,
        ...style,
      }}
    >
      <span
        style={{
          position: "absolute",
          left: "14px",
          top: "50%",
          transform: "translateY(-50%)",
          color: color.textHint,
          display: "flex",
          pointerEvents: "none",
        }}
        aria-hidden
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </span>
      <input
        type="search"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        aria-label={ariaLabel}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: "100%",
          background: color.surface,
          border: "none",
          borderRadius: radius.xl,
          padding: "11px 36px 11px 38px",
          fontSize: font.size.body,
          color: color.text,
          fontFamily: font.family,
          outline: "none",
          boxShadow: focused ? depth.insetFocus : depth.insetSm,
          transition: `box-shadow ${transition.default}`,
          ...inputStyle,
        }}
      />
      {showClear && value && onClear && (
        <button
          type="button"
          onClick={onClear}
          aria-label="Bersihkan pencarian"
          style={{
            position: "absolute",
            right: "10px",
            top: "50%",
            transform: "translateY(-50%)",
            background: "none",
            border: "none",
            color: color.textSubtle,
            cursor: "pointer",
            fontSize: "12px",
            padding: "4px",
            fontFamily: font.family,
          }}
        >
          ✕
        </button>
      )}
    </div>
  )
}
