/**
 * Calm Civic Operations UI — design tokens.
 * Single source of truth for color, depth, type, spacing, and kiosk status semantics.
 */

export const color = {
  bg: "#EDEAE6",
  surface: "#EDEAE6",
  surfaceAlt: "rgba(196,191,184,0.15)",
  text: "#1A1A18",
  textStrong: "#2A2520",
  textMuted: "#8A8680",
  textSubtle: "#7A7670",
  textHint: "#9A9590",
  border: "rgba(196,191,184,0.45)",
  borderStrong: "rgba(196,191,184,0.5)",
  focusRing: "0 0 0 2px #EDEAE6, 0 0 0 4px #2D6A4F",
  brand: "#2D6A4F",
  brandDark: "#1A4A33",
  danger: "#C0392B",
  dangerBg: "rgba(192,57,43,0.08)",
  success: "#418840",
  accent: "#C49A3C",
  overlayScrim: "rgba(42,37,32,0.38)",
  scrollbar: "#D0CCCA",
  shadowDark: "#D0CCCA",
  shadowLight: "#FFFFFF",
}

export const depth = {
  /** Raised panel / card */
  raised: `6px 6px 14px ${color.shadowDark}, -6px -6px 14px ${color.shadowLight}`,
  raisedSm: `4px 4px 10px ${color.shadowDark}, -4px -4px 10px ${color.shadowLight}`,
  raisedSmPress: `3px 3px 7px ${color.shadowDark}, -3px -3px 7px ${color.shadowLight}`,
  /** Inset: inputs, active nav */
  inset: `inset 4px 4px 10px ${color.shadowDark}, inset -4px -4px 10px ${color.shadowLight}`,
  insetSm: `inset 3px 3px 7px ${color.shadowDark}, inset -3px -3px 7px ${color.shadowLight}`,
  /** Focused input (stronger inner shadow) */
  insetFocus: "inset 3px 3px 7px #B8B4AE, inset -3px -3px 7px #FFFFFF",
  /** Modal / map overlay */
  overlayCard: "10px 10px 28px rgba(42,37,32,0.28), -6px -6px 18px rgba(255,255,255,0.35)",
  topbar: "0 4px 12px rgba(0,0,0,0.06)",
}

export const radius = {
  sm: "6px",
  md: "8px",
  lg: "10px",
  xl: "12px",
  "2xl": "14px",
  "3xl": "16px",
  full: "9999px",
}

export const space = {
  1: "4px",
  2: "8px",
  3: "10px",
  4: "12px",
  5: "16px",
  6: "20px",
  7: "24px",
  8: "28px",
  9: "32px",
}

export const font = {
  family: "'Inter', 'Plus Jakarta Sans', sans-serif",
  size: {
    xs: "10px",
    sm: "11px",
    body: "13px",
    md: "14px",
    title: "16px",
    page: "26px",
  },
  weight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  letter: {
    caps: "1.5px",
  },
}

export const transition = {
  fast: "0.15s",
  default: "0.18s",
  slow: "0.25s",
}

export const zIndex = {
  dropdown: 100,
  modal: 1000,
  mapOverlay: 2000,
  toast: 3000,
}

/**
 * Kiosk / heartbeat status semantics: label, pill background, text, marker dot.
 * Use for lists, maps, and badges consistently.
 */
export const statusKiosk = {
  operational:  { label: "Operational",  bg: "#E8F4EC", text: "#2D6A4F", dot: "#418840" },
  stale:          { label: "Stale",          bg: "#FEF5E7", text: "#9B7228", dot: "#C49A3C" },
  maintenance:   { label: "Maintenance",    bg: "#E3F2FD", text: "#1565C0", dot: "#1976D2" },
  out_of_order:   { label: "Out of Order",   bg: "#FDECEA", text: "#C0392B", dot: "#D83A2F" },
  disconnected:   { label: "Disconnected",   bg: "#F3F2F0", text: "#6A6860", dot: "#9A9890" },
  pending:        { label: "Pending",         bg: "#FAFAFA", text: "#9E9E9E", dot: "#BDBDBD" },
}

export function getStatusKiosk(key) {
  return statusKiosk[key] || statusKiosk.pending
}
