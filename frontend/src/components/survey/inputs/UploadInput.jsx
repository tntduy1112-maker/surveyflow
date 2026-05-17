import { useRef } from 'react'
import useSurveyStore from '../../../store/useSurveyStore'

function fmtSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1048576).toFixed(1) + ' MB'
}

export default function UploadInput({ question }) {
  const { isSelected, toggleMultiple, others, setOther, uploadedFiles, addFiles, removeFile } = useSurveyStore()
  const otherSelected = isSelected(question.id, '__other__')
  const fileInputRefs = useRef({})

  function handleDrop(e, optValue) {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    if (files.length) addFiles(question.id, optValue, files)
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="text-[12px] text-gray-dark bg-gray-bg border border-gray-border rounded px-2 py-1 w-fit mb-1">
        Select all that apply
      </div>

      {question.options.map(opt => {
        const selected = isSelected(question.id, opt.value)
        const fileKey = `${question.id}_${opt.value}`
        const files = uploadedFiles[fileKey] || []

        return (
          <div key={opt.value}>
            <label
              onClick={() => toggleMultiple(question.id, opt.value)}
              className={`flex items-start gap-3 px-4 py-3 border-[1.5px] rounded-[5px] cursor-pointer transition-all duration-150 select-none
                ${selected
                  ? 'border-primary bg-blue-light shadow-[0_0_0_2px_rgba(12,102,228,0.12)]'
                  : 'border-gray-border hover:border-blue-mid hover:bg-[#F8FBFF]'}`}
            >
              <input
                type="checkbox"
                value={opt.value}
                checked={selected}
                onChange={() => toggleMultiple(question.id, opt.value)}
                className="mt-0.5 w-4 h-4 flex-shrink-0 accent-primary cursor-pointer"
              />
              <div className="text-[15px] font-medium text-navy leading-snug flex-1">{opt.label}</div>
            </label>

            {selected && opt.canUpload && (
              <div className="mt-2 ml-2">
                <input
                  ref={el => fileInputRefs.current[opt.value] = el}
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx,.txt,.md,.sketch,.fig"
                  className="hidden"
                  onChange={e => {
                    addFiles(question.id, opt.value, Array.from(e.target.files))
                    e.target.value = ''
                  }}
                />
                <div
                  onClick={() => fileInputRefs.current[opt.value]?.click()}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => handleDrop(e, opt.value)}
                  className="border-2 border-dashed border-gray-border rounded-md p-5 text-center cursor-pointer
                             hover:border-primary hover:bg-blue-light/30 transition-colors duration-150"
                >
                  <div className="text-2xl mb-1">📎</div>
                  <div className="text-[13px] text-gray-dark leading-snug">
                    <span className="text-primary font-semibold">Click to upload</span> or drag and drop
                    <br />Images, PDFs, Word docs, Figma exports
                  </div>
                </div>

                {files.length > 0 && (
                  <div className="mt-2 flex flex-col gap-1.5">
                    {files.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 bg-gray-bg rounded px-3 py-2 text-[13px]">
                        <span>📄</span>
                        <span className="flex-1 truncate text-navy">{f.name}</span>
                        <span className="text-gray-medium flex-shrink-0">{fmtSize(f.size)}</span>
                        <button
                          onClick={() => removeFile(question.id, opt.value, i)}
                          className="text-gray-medium hover:text-red-600 text-base leading-none flex-shrink-0"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}

      {question.hasOther && (
        <>
          <label
            onClick={() => toggleMultiple(question.id, '__other__')}
            className={`flex items-start gap-3 px-4 py-3 border-[1.5px] rounded-[5px] cursor-pointer transition-all duration-150 select-none
              ${otherSelected
                ? 'border-primary bg-blue-light shadow-[0_0_0_2px_rgba(12,102,228,0.12)]'
                : 'border-gray-border hover:border-blue-mid hover:bg-[#F8FBFF]'}`}
          >
            <input
              type="checkbox"
              checked={otherSelected}
              onChange={() => toggleMultiple(question.id, '__other__')}
              className="mt-0.5 w-4 h-4 flex-shrink-0 accent-primary cursor-pointer"
            />
            <div className="text-[15px] font-medium text-navy flex-1">Other</div>
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
