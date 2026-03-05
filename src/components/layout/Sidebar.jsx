import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Monitor, Map, ListVideo,
  Image, MousePointerClick, Settings
} from 'lucide-react'

const nav = [
  { to: '/dashboard',   label: 'Dashboard',   icon: LayoutDashboard },
  { to: '/kiosks',      label: 'Kiosks',       icon: Monitor },
  { to: '/regions',     label: 'Regions',      icon: Map },
  { to: '/playlists',   label: 'Playlists',    icon: ListVideo },
  { to: '/media',       label: 'Media',        icon: Image },
  { to: '/interactive', label: 'Interactive',  icon: MousePointerClick },
  { to: '/settings',    label: 'Settings',     icon: Settings },
]

export default function Sidebar() {
  return (
    <aside className="w-60 bg-white border-r border-gray-200 flex flex-col">
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <span className="text-lg font-bold text-gray-900">eKiosk CMS</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
              ${isActive
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
