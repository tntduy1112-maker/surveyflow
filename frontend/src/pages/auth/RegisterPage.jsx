import { useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import Navbar from '../../components/ui/Navbar'
import useAuthStore from '../../store/useAuthStore'

export default function RegisterPage() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { register, isLoading } = useAuthStore()

  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState(null)

  const from = location.state?.from || '/dashboard'

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    try {
      await register(email, password, name)
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
          <h1 className="text-xl font-medium text-navy mb-1">Create account</h1>
          <p className="text-[13px] text-gray-dark mb-6">
            Free account — unlocks AI document generation.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-[14px] font-semibold text-navy mb-1.5">Name <span className="font-normal text-gray-medium">(optional)</span></label>
              <input
                type="text" autoFocus
                value={name} onChange={e => setName(e.target.value)}
                placeholder="Your name"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-[14px] font-semibold text-navy mb-1.5">Email</label>
              <input
                type="email" required
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
                placeholder="At least 8 characters"
                className="input-field"
              />
            </div>

            {error && (
              <p className="text-[13px] text-red-500 bg-red-50 border border-red-200 rounded px-3 py-2">
                {error}
              </p>
            )}

            <button type="submit" disabled={isLoading} className="btn-primary justify-center mt-1">
              {isLoading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="text-center text-[13px] text-gray-dark mt-5">
            Already have an account?{' '}
            <Link to="/login" state={{ from }} className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
