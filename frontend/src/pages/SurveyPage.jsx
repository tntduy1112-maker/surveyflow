import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar        from '../components/ui/Navbar'
import ProgressBar   from '../components/ui/ProgressBar'
import QuestionCard  from '../components/survey/QuestionCard'
import NavButtons    from '../components/survey/NavButtons'
import useSurveyStore from '../store/useSurveyStore'
import { saveAnswer } from '../services/survey.service'

export default function SurveyPage() {
  const routerNavigate = useNavigate()
  const store = useSurveyStore()
  const [isSaving,   setIsSaving]   = useState(false)
  const [submitError, setSubmitError] = useState(null)

  const visible  = store.getVisible()
  const total    = visible.length
  const question = visible[store.currentIdx]

  useEffect(() => {
    store.initSession()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleNext() {
    if (store.currentIdx < total - 1) {
      await store.navigate(1, question?.id)
      return
    }

    // Last question — flush final answer then go to results chooser
    // No submit / Claude call here — that happens only if user picks Option 2
    if (!store.sessionId) {
      setSubmitError('No session found. Please refresh and try again.')
      return
    }

    setIsSaving(true)
    setSubmitError(null)

    try {
      if (question?.id) {
        const answer = store.answers[question.id] || {}
        await saveAnswer(store.sessionId, {
          question_id: question.id,
          answer,
          current_step: total,
          total_steps: total,
        })
      }
      routerNavigate(`/results/${store.sessionId}`)
    } catch (err) {
      // Network error — still navigate, answers are mostly saved
      routerNavigate(`/results/${store.sessionId}`)
    }
  }

  if (store.isInitializing) {
    return (
      <div className="min-h-screen bg-gray-bg flex items-center justify-center">
        <p className="text-gray-dark text-[15px]">Starting survey...</p>
      </div>
    )
  }

  if (!question) return null

  return (
    <div className="min-h-screen bg-gray-bg">
      <Navbar stepLabel={`${store.currentIdx + 1} / ${total}`} />

      <div className="max-w-[680px] mx-auto mt-10 mb-24 px-6">
        <ProgressBar current={store.currentIdx} total={total} />

        <QuestionCard
          key={question.id}
          question={question}
          questionNumber={store.currentIdx + 1}
          total={total}
        />

        <NavButtons
          onBack={() => store.navigate(-1, null)}
          onNext={handleNext}
          isFirst={store.currentIdx === 0}
          isLast={store.currentIdx === total - 1}
          isSubmitting={isSaving}
        />

        {(store.initError || submitError) && (
          <p className="mt-4 text-center text-[13px] text-red-500">
            {submitError || 'Could not connect to server — answers will sync when connection restores.'}
          </p>
        )}
      </div>
    </div>
  )
}
