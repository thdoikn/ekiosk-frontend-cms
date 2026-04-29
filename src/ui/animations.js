/** Shared keyframes for page enter and loading shimmer (inject via <style>{animationsCss}</style>). */
export const animationsCss = `
  @keyframes civFadeUp  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes civFadeIn  { from{opacity:0} to{opacity:1} }
  @keyframes civSlideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes civShimmer { 0%{background-position:-600px 0} 100%{background-position:600px 0} }
  @keyframes civSpin    { to { transform: rotate(360deg) } }
  @keyframes civPulse   { 0%, 100% { opacity: 1 } 50% { opacity: 0.4 } }
`
