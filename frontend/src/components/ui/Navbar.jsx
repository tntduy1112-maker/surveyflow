import { Link } from 'react-router-dom'
import useAuthStore from '../../store/useAuthStore'

export default function Navbar({ stepLabel }) {
  const { isAuthenticated, user } = useAuthStore()

  return (
    <nav className="bg-white border-b border-gray-border h-[60px] flex items-center px-6 gap-3 sticky top-0 z-10">
      <Link to="/" className="flex items-center gap-2 no-underline">
        <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          C
        </div>
        <span className="text-[15px] font-semibold text-navy">Build with Claude</span>
      </Link>
      <div className="flex-1" />
      {stepLabel && <span className="text-[13px] text-gray-dark">{stepLabel}</span>}
      {!stepLabel && (
        isAuthenticated() ? (
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="text-[13px] text-gray-dark hover:text-navy font-medium">
              {user?.name || user?.email?.split('@')[0] || 'My surveys'}
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link to="/login" className="text-[13px] text-gray-dark hover:text-navy font-medium px-3">
              Sign in
            </Link>
            <Link to="/register" className="btn-primary text-[13px] px-4 py-2 min-h-[34px]">
              Register free
            </Link>
          </div>
        )
      )}
    </nav>
  )
}
