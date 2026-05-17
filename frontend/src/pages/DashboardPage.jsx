import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Navbar from '../components/ui/Navbar'
import useAuthStore from '../store/useAuthStore'
import api from '../api/axiosInstance'

const STATUS_LABEL = {
  in_progress: { label: 'In progress', color: 'text-gray-dark bg-gray-bg border-gray-border' },
  submitted:   { label: 'Processing',  color: 'text-blue-600 bg-blue-light border-blue-mid' },
  completed:   { label: 'Ready',       color: 'text-green-700 bg-green-50 border-green-200' },
  failed:      { label: 'Failed',      color: 'text-red-600 bg-red-50 border-red-200' },
}

function StatusBadge({ status }) {
  const { label, color } = STATUS_LABEL[status] || STATUS_LABEL.in_progress
  return (
    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${color}`}>
      {label}
    </span>
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuthStore()
  const [sessions, setSessions] = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    if (!isAuthenticated()) { navigate('/login'); return }
    api.get('/auth/sessions')
      .then(res => setSessions(res.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleLogout() {
    await logout()
    navigate('/survey')
  }

  return (
    <div className="min-h-screen bg-gray-bg">
      <Navbar />

      <div className="max-w-[760px] mx-auto mt-10 mb-24 px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-medium text-navy">My surveys</h1>
            <p className="text-[13px] text-gray-dark mt-0.5">{user?.email}</p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/survey" className="btn-primary text-[14px] px-4 py-2 min-h-[38px]">
              + New survey
            </Link>
            <button onClick={handleLogout} className="btn-ghost text-[13px]">
              Sign out
            </button>
          </div>
        </div>

        {/* Sessions list */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-dark text-[15px] mb-4">No surveys yet.</p>
            <Link to="/survey" className="btn-primary mx-auto">Start your first survey</Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {sessions.map(s => (
              <div
                key={s.id}
                className="card p-5 flex items-center justify-between gap-4 hover:shadow-card-hover transition-shadow duration-150"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[15px] font-medium text-navy truncate">
                      {s.app_name || 'Untitled survey'}
                    </span>
                    <StatusBadge status={s.status} />
                  </div>
                  <p className="text-[12px] text-gray-medium">
                    {new Date(s.created_at).toLocaleDateString('en-US', {
                      year: 'numeric', month: 'short', day: 'numeric',
                    })}
                    {' · '}{s.detail_level || 'rough'} · {s.total_steps} questions
                  </p>
                </div>

                {s.status === 'completed' ? (
                  <Link
                    to={`/results/${s.id}`}
                    className="btn-primary text-[13px] px-4 py-2 min-h-[36px] flex-shrink-0"
                  >
                    View results
                  </Link>
                ) : s.status === 'in_progress' ? (
                  <Link
                    to="/survey"
                    onClick={() => localStorage.setItem('survey_session_id', s.id)}
                    className="btn-secondary text-[13px] px-4 py-2 min-h-[36px] flex-shrink-0"
                  >
                    Continue
                  </Link>
                ) : (
                  <span className="text-[13px] text-gray-medium flex-shrink-0">{s.status}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
