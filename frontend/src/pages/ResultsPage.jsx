import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar    from '../components/ui/Navbar'
import BriefPanel from '../components/results/BriefPanel'
import DocsPanel  from '../components/results/DocsPanel'
import { getOutput } from '../services/survey.service'

const OPTION_CLAUDE = 'claude'
const OPTION_AI     = 'ai'

export default function ResultsPage() {
  const { sessionId } = useParams()
  const navigate      = useNavigate()

  const [output,   setOutput]   = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)
  const [activeOption, setActiveOption] = useState(null)

  useEffect(() => {
    if (!sessionId) return
    getOutput(sessionId)
      .then(res => setOutput(res.data.data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [sessionId])

  // ── loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-bg flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-[14px] text-gray-dark">Loading your results...</p>
      </div>
    )
  }

  // ── error ──────────────────────────────────────────────────────────────────
  if (error || !output) {
    return (
      <div className="min-h-screen bg-gray-bg">
        <Navbar />
        <div className="max-w-[680px] mx-auto mt-16 px-6">
          <div className="card text-center">
            <div className="text-3xl mb-3">⚠️</div>
            <h2 className="text-xl font-medium text-navy mb-2">Could not load results</h2>
            <p className="text-[14px] text-gray-dark mb-6">{error || 'Output not found.'}</p>
            <button onClick={() => navigate('/survey')} className="btn-primary mx-auto">
              Start new survey
            </button>
          </div>
        </div>
      </div>
    )
  }

  const hasDocs = output.product_spec || output.user_stories || output.deployment_plan || output.test_cases

  // ── chooser ────────────────────────────────────────────────────────────────
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
            {/* Option 1 — Claude Code */}
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
                Copy the plain-text brief and paste it into Claude Code. Run{' '}
                <code className="bg-gray-bg px-1 rounded text-[12px]">/business-case</code>{' '}
                to start the full 9-step build pipeline.
              </p>
              <div className="mt-4 text-[13px] font-semibold text-primary group-hover:underline">
                Copy brief →
              </div>
            </button>

            {/* Option 2 — Any AI */}
            <button
              onClick={() => setActiveOption(OPTION_AI)}
              disabled={!hasDocs}
              className="text-left p-6 bg-white border-[1.5px] border-gray-border rounded-lg
                         hover:border-primary hover:shadow-[0_0_0_3px_rgba(12,102,228,0.1)]
                         transition-all duration-150 group
                         disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-border
                         disabled:hover:shadow-none"
            >
              <div className="text-2xl mb-3">🤖</div>
              <h3 className="text-[16px] font-semibold text-navy mb-1 group-hover:text-primary transition-colors">
                Use with any AI
              </h3>
              <p className="text-[13px] text-gray-dark leading-relaxed">
                View and download 4 AI-generated documents — Spec, Stories, Deployment Plan, Test Cases — ready for Codex, Gemini, or any other tool.
              </p>
              {!hasDocs ? (
                <div className="mt-4 text-[13px] text-gray-medium">
                  Documents not generated (API key not set)
                </div>
              ) : (
                <div className="mt-4 text-[13px] font-semibold text-primary group-hover:underline">
                  View documents →
                </div>
              )}
            </button>
          </div>

          {/* Restart */}
          <div className="text-center mt-8">
            <button
              onClick={() => {
                localStorage.removeItem('survey_session_id')
                navigate('/survey')
              }}
              className="btn-ghost text-[13px]"
            >
              ← Start a new survey
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── active panel ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-bg">
      <Navbar />
      <div className="max-w-[760px] mx-auto mt-10 mb-24 px-6">

        {/* Back to chooser */}
        <button
          onClick={() => setActiveOption(null)}
          className="btn-ghost text-[13px] mb-6 -ml-2"
        >
          ← Back to options
        </button>

        {/* Panel heading */}
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

        {/* Panel content */}
        {activeOption === OPTION_CLAUDE && output.brief_text && (
          <BriefPanel brief={output.brief_text} />
        )}
        {activeOption === OPTION_AI && (
          <DocsPanel output={output} />
        )}

        {/* Restart */}
        <div className="text-center mt-10">
          <button
            onClick={() => {
              localStorage.removeItem('survey_session_id')
              navigate('/survey')
            }}
            className="btn-ghost text-[13px]"
          >
            ← Start a new survey
          </button>
        </div>
      </div>
    </div>
  )
}
