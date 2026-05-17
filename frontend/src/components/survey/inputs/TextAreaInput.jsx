import useSurveyStore from '../../../store/useSurveyStore'

export default function TextAreaInput({ question }) {
  const { answers, setTextarea } = useSurveyStore()
  // stored as { text: '...' }
  const value = answers[question.id]?.text || ''

  return (
    <textarea
      rows={6}
      placeholder={question.placeholder || ''}
      value={value}
      onChange={e => setTextarea(question.id, e.target.value)}
      className="input-field resize-y min-h-[130px]"
    />
  )
}
