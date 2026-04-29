import { radius, space } from "./tokens"

/** Shimmer row placeholders for list/table loading. */
export function SkeletonRow({ delay = "0s", style }) {
  return (
    <div
      style={{
        height: "52px",
        borderRadius: radius.md,
        marginBottom: space[2],
        background: "linear-gradient(90deg, #D8D4CF 25%, #E8E4DF 50%, #D8D4CF 75%)",
        backgroundSize: "600px 100%",
        animation: "civShimmer 1.4s infinite",
        animationDelay: delay,
        ...style,
      }}
    />
  )
}

export default function LoadingSkeleton({ rows = 5, rowHeight = 52, gap = 6, style }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap, ...style }}>
      {[...Array(rows)].map((_, i) => (
        <SkeletonRow key={i} delay={`${i * 0.08}s`} style={rowHeight ? { height: rowHeight } : undefined} />
      ))}
    </div>
  )
}
