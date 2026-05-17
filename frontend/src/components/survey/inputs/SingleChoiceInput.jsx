import useSurveyStore from '../../../store/useSurveyStore'

export default function SingleChoiceInput({ question }) {
  const { isSelected, setSingle, others, setOther } = useSurveyStore()
  const otherSelected = isSelected(question.id, '__other__')

  function handleSelect(value) {
    setSingle(question.id, value)
    // detail_level change is handled reactively in the store via getVisible()
  }

  return (
    <div className="flex flex-col gap-2">
      {question.options.map(opt => {
        const selected = isSelected(question.id, opt.value)
        return (
          <label
            key={opt.value}
            onClick={() => handleSelect(opt.value)}
            className={`flex items-start gap-3 px-4 py-3 border-[1.5px] rounded-[5px] cursor-pointer transition-all duration-150 select-none
              ${selected
                ? 'border-primary bg-blue-light shadow-[0_0_0_2px_rgba(12,102,228,0.12)]'
                : 'border-gray-border hover:border-blue-mid hover:bg-[#F8FBFF]'}`}
          >
            <input
              type="radio"
              name={question.id}
              value={opt.value}
              checked={selected}
              onChange={() => handleSelect(opt.value)}
              className="mt-0.5 w-4 h-4 flex-shrink-0 accent-primary cursor-pointer"
            />
            <div className="flex-1">
              <div className="text-[15px] font-medium text-navy leading-snug">{opt.label}</div>
              {opt.desc && <div className="text-[13px] text-gray-dark mt-0.5 leading-snug">{opt.desc}</div>}
            </div>
          </label>
        )
      })}

      {question.hasOther && (
        <>
          <label
            onClick={() => handleSelect('__other__')}
            className={`flex items-start gap-3 px-4 py-3 border-[1.5px] rounded-[5px] cursor-pointer transition-all duration-150 select-none
              ${otherSelected
                ? 'border-primary bg-blue-light shadow-[0_0_0_2px_rgba(12,102,228,0.12)]'
                : 'border-gray-border hover:border-blue-mid hover:bg-[#F8FBFF]'}`}
          >
            <input
              type="radio"
              name={question.id}
              value="__other__"
              checked={otherSelected}
              onChange={() => handleSelect('__other__')}
              className="mt-0.5 w-4 h-4 flex-shrink-0 accent-primary cursor-pointer"
            />
            <div className="flex-1">
              <div className="text-[15px] font-medium text-navy leading-snug">Other</div>
              <div className="text-[13px] text-gray-dark mt-0.5">Type your own answer</div>
            </div>
          </label>

          {otherSelected && (
            <textarea
              autoFocus
              rows={3}
              placeholder="Describe in your own words..."
              value={others[question.id] || ''}
              onChange={e => setOther(question.id, e.target.value)}
              className="input-field resize-y mt-1"
            />
          )}
        </>
      )}
    </div>
  )
}
