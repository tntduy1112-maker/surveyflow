import useSurveyStore from '../../../store/useSurveyStore'

export default function TextFieldsInput({ question }) {
  const { answers, setTextField } = useSurveyStore()
  // answers[id] is a plain object of fieldKey -> value for text_fields type
  const fieldValues = answers[question.id] || {}

  return (
    <div className="flex flex-col gap-4">
      {question.fields.map(f => (
        <div key={f.key}>
          <label className="block text-[14px] font-semibold text-navy mb-1.5">
            {f.label}{' '}
            {f.optional && <span className="font-normal text-gray-medium text-[13px]">(optional)</span>}
          </label>
          <input
            type="text"
            className="input-field"
            placeholder={f.placeholder}
            value={fieldValues[f.key] || ''}
            onChange={e => setTextField(question.id, f.key, e.target.value)}
          />
        </div>
      ))}

      {question.extraTextarea && (
        <div>
          <label className="block text-[14px] font-semibold text-navy mb-1.5">
            {question.extraTextarea.label}{' '}
            {question.extraTextarea.optional && (
              <span className="font-normal text-gray-medium text-[13px]">(optional)</span>
            )}
          </label>
          <textarea
            className="input-field resize-y min-h-[100px]"
            placeholder={question.extraTextarea.placeholder}
            value={fieldValues[question.extraTextarea.key] || ''}
            onChange={e => setTextField(question.id, question.extraTextarea.key, e.target.value)}
          />
        </div>
      )}
    </div>
  )
}
