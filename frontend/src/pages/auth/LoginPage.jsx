import { useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import Navbar from '../../components/ui/Navbar'
import useAuthStore from '../../store/useAuthStore'

export default function LoginPage() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { login, isLoading } = useAuthStore()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState(null)

  // After login, return to where the user came from (default: dashboard)
  const from = location.state?.from || '/dashboard'

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    try {
      await login(email, password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="min-h-screen bg-gray-bg">
      <Navbar />
      <div className="max-w-[420px] mx-auto mt-16 px-6">
        <div className="card">
          <h1 className="text-xl font-medium text-navy mb-1">Sign in</h1>
          <p className="text-[13px] text-gray-dark mb-6">
            Continue to generate AI documents for your product idea.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-[14px] font-semibold text-navy mb-1.5">Email</label>
              <input
                type="email" required autoFocus
                value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-[14px] font-semibold text-navy mb-1.5">Password</label>
              <input
                type="password" required
                value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-field"
              />
            </div>

            {error && (
              <p className="text-[13px] text-red-500 bg-red-50 border border-red-200 rounded px-3 py-2">
                {error}
              </p>
            )}

            <button type="submit" disabled={isLoading} className="btn-primary justify-center mt-1">
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-[13px] text-gray-dark mt-5">
            No account?{' '}
            <Link to="/register" state={{ from }} className="text-primary hover:underline font-medium">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
