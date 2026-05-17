import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import Navbar     from '../components/ui/Navbar'
import BriefPanel from '../components/results/BriefPanel'
import DocsPanel  from '../components/results/DocsPanel'
import { getSession, getOutput, submitSurvey } from '../services/survey.service'
import useAuthStore from '../store/useAuthStore'
import { generateBrief } from '../utils/generateBrief'

const OPTION_CLAUDE = 'claude'
const OPTION_AI     = 'ai'

export default function ResultsPage() {
  const { sessionId } = useParams()
  const navigate      = useNavigate()
  const { isAuthenticated } = useAuthStore()

  const [session,      setSession]      = useState(null)
  const [brief,        setBrief]        = useState(null)
  const [docsOutput,   setDocsOutput]   = useState(null)
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState(null)
  const [activeOption, setActiveOption] = useState(null)
  const [generating,   setGenerating]   = useState(false)
  const [genError,     setGenError]     = useState(null)

  useEffect(() => {
    if (!sessionId) return
    // Load session answers to generate the brief client-side
    Promise.all([
      getSession(sessionId),
      getOutput(sessionId).catch(() => null), // may not exist yet
    ]).then(([sessRes, outRes]) => {
      const sess = sessRes.data.data
      setSession(sess)
      // Generate brief from answers in-browser (no Claude call needed)
      if (sess?.answers?.length) {
        setBrief(generateBrief(sess.answers, sess.detail_level))
      }
      // If docs already exist (re-visit after generation), load them
      if (outRes?.data?.data?.product_spec) {
        setDocsOutput(outRes.data.data)
      }
    }).catch(err => setError(err.message))
    .finally(() => setLoading(false))
  }, [sessionId])

  async function handleGenerateDocs() {
    setGenerating(true)
    setGenError(null)
    try {
      const res = await submitSurvey(sessionId)
      setDocsOutput(res.data.data)
      setActiveOption(OPTION_AI)
    } catch (err) {
      setGenError(err.message)
    } finally {
      setGenerating(false)
    }
  }

  // ── loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-bg flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-[14px] text-gray-dark">Preparing your results...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-bg">
        <Navbar />
        <div className="max-w-[680px] mx-auto mt-16 px-6">
          <div className="card text-center">
            <h2 className="text-xl font-medium text-navy mb-2">Could not load results</h2>
            <p className="text-[14px] text-gray-dark mb-6">{error}</p>
            <button onClick={() => navigate('/survey')} className="btn-primary mx-auto">Start new survey</button>
          </div>
        </div>
      </div>
    )
  }

  // ── chooser ───────────────────────────────────────────────────────────────
  if (!activeOption) {
    return (
      <div className="min-h-screen bg-gray-bg">
        <Navbar />
        <div className="max-w-[760px] mx-auto mt-12 mb-24 px-6">
          {/* Hero */}
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-blue-light rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
              🚀
            </div>
            <h1 className="text-2xl font-medium text-navy mb-2">Your brief is ready</h1>
            <p className="text-[14px] text-gray-dark">Choose how you want to use it</p>
          </div>

          {/* Two option cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Option 1 — Claude Code (no login needed) */}
            <button
              onClick={() => setActiveOption(OPTION_CLAUDE)}
              className="text-left p-6 bg-white border-[1.5px] border-gray-border rounded-lg
                         hover:border-primary hover:shadow-[0_0_0_3px_rgba(12,102,228,0.1)]
                         transition-all duration-150 group"
            >
              <div className="text-2xl mb-3">⚡</div>
              <h3 className="text-[16px] font-semibold text-navy mb-1 group-hover:text-primary transition-colors">
                Use with Claude Code
              </h3>
              <p className="text-[13px] text-gray-dark leading-relaxed">
                Copy the plain-text brief and paste into Claude Code. Run{' '}
                <code className="bg-gray-bg px-1 rounded text-[12px]">/business-case</code>{' '}
                to start the full 9-step build pipeline.
              </p>
              <div className="mt-4 text-[13px] font-semibold text-primary group-hover:underline">
                Copy brief — no login needed →
              </div>
            </button>

            {/* Option 2 — Any AI (login-gated) */}
            <div className="text-left p-6 bg-white border-[1.5px] border-gray-border rounded-lg">
              <div className="text-2xl mb-3">🤖</div>
              <h3 className="text-[16px] font-semibold text-navy mb-1">Use with any AI</h3>
              <p className="text-[13px] text-gray-dark leading-relaxed mb-4">
                Get 4 AI-generated documents — Spec, Stories, Deployment Plan, Test Cases — for Codex, Gemini, or any other tool.
              </p>

              {docsOutput?.product_spec ? (
                // Already generated — go straight to docs view
                <button
                  onClick={() => setActiveOption(OPTION_AI)}
                  className="text-[13px] font-semibold text-primary hover:underline"
                >
                  View documents →
                </button>
              ) : !isAuthenticated() ? (
                // Not logged in — show gate
                <div>
                  <p className="text-[12px] text-gray-medium mb-3">Free account required to generate AI documents.</p>
                  <div className="flex gap-2 flex-wrap">
                    <Link
                      to="/login"
                      state={{ from: `/results/${sessionId}` }}
                      className="btn-primary text-[13px] px-4 py-2 min-h-[36px]"
                    >
                      Sign in
                    </Link>
                    <Link
                      to="/register"
                      state={{ from: `/results/${sessionId}` }}
                      className="btn-secondary text-[13px] px-4 py-2 min-h-[36px]"
                    >
                      Register free
                    </Link>
                  </div>
                </div>
              ) : generating ? (
                <div className="flex items-center gap-2 text-[13px] text-gray-dark">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  Generating... (~30s)
                </div>
              ) : (
                <div>
                  {genError && <p className="text-[12px] text-red-500 mb-2">{genError}</p>}
                  <button onClick={handleGenerateDocs} className="btn-primary text-[13px] px-4 py-2 min-h-[36px]">
                    Generate AI docs →
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Restart */}
          <div className="text-center mt-8">
            <button
              onClick={() => { localStorage.removeItem('survey_session_id'); navigate('/survey') }}
              className="btn-ghost text-[13px]"
            >
              ← Start a new survey
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── active panel ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-bg">
      <Navbar />
      <div className="max-w-[760px] mx-auto mt-10 mb-24 px-6">
        <button onClick={() => setActiveOption(null)} className="btn-ghost text-[13px] mb-6 -ml-2">
          ← Back to options
        </button>

        <div className="mb-6">
          <h2 className="text-xl font-medium text-navy">
            {activeOption === OPTION_CLAUDE ? '⚡ Claude Code Brief' : '🤖 AI Document Package'}
          </h2>
          <p className="text-[13px] text-gray-dark mt-1">
            {activeOption === OPTION_CLAUDE
              ? 'Copy and paste into Claude Code, then run /business-case'
              : 'View and download each document for use with any AI tool'}
          </p>
        </div>

        {activeOption === OPTION_CLAUDE && brief && <BriefPanel brief={brief} />}
        {activeOption === OPTION_AI && docsOutput && <DocsPanel output={docsOutput} />}

        <div className="text-center mt-10">
          <button
            onClick={() => { localStorage.removeItem('survey_session_id'); navigate('/survey') }}
            className="btn-ghost text-[13px]"
          >
            ← Start a new survey
          </button>
        </div>
      </div>
    </div>
  )
}
