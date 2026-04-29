import { font, space } from "./tokens"

/** Filter/search row: horizontal wrap with consistent gap. */
export default function Toolbar({ children, style }) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: space[4],
        fontFamily: font.family,
        marginBottom: space[4],
        ...style,
      }}
    >
      {children}
    </div>
  )
}
