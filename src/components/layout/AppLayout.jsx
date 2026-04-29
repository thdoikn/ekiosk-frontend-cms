import { useState } from "react"
import { Outlet } from "react-router-dom"
import { animationsCss } from "../../ui/animations"
import { color, font } from "../../ui/tokens"
import Sidebar from "./Sidebar"
import Topbar from "./Topbar"

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div style={layoutStyles.root}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      <div style={layoutStyles.main}>
        <Topbar />
        <main style={layoutStyles.content}>
          <Outlet />
        </main>
      </div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        ${animationsCss}
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${color.bg}; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${color.scrollbar}; border-radius: 3px; }
      `}</style>
    </div>
  )
}

const layoutStyles = {
  root: {
    display: "flex",
    height: "100vh",
    background: color.bg,
    fontFamily: font.family,
    overflow: "hidden",
  },
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    minWidth: 0,
  },
  content: {
    flex: 1,
    overflowY: "auto",
    padding: "28px 32px",
    background: color.bg,
  },
}
