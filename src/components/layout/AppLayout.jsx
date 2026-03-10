import { useState } from "react"
import { Outlet } from "react-router-dom"
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

        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #F5F1EA; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #F5F1EA; }
        ::-webkit-scrollbar-thumb { background: #D0CAC0; border-radius: 3px; }
      `}</style>
    </div>
  )
}

const layoutStyles = {
  root: {
    display: "flex",
    height: "100vh",
    background: "#F5F1EA",
    fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
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
    padding: "32px",
    background: "#F5F1EA",
  },
}
