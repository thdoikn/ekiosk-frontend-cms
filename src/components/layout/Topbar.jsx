import { useAuthStore } from '../../store/authStore'
import { useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'

export default function Topbar() {
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-end px-6">
      <button
        onClick={handleLogout}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
      >
        <LogOut size={16} />
        Logout
      </button>
    </header>
  )
}
