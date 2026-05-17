import TextFieldsInput  from './inputs/TextFieldsInput'
import SingleChoiceInput from './inputs/SingleChoiceInput'
import MultiChoiceInput  from './inputs/MultiChoiceInput'
import UploadInput       from './inputs/UploadInput'
import TextAreaInput     from './inputs/TextAreaInput'

export default function QuestionCard({ question, questionNumber, total, onSelect }) {
  return (
    // key on question.id causes React to unmount+remount → triggers fadeUp CSS animation
    <div className="card animate-[fadeUp_0.22s_ease]">
      {question.tag && (
        <div className="inline-block bg-blue-light text-primary text-[11px] font-bold uppercase tracking-wide px-3 py-1 rounded-full mb-3">
          {question.tag}
        </div>
      )}

      <div className="text-[12px] text-gray-medium font-semibold mb-1">
        Question {questionNumber} of {total}
      </div>

      <h2 className="text-xl font-medium text-navy leading-snug mb-1.5">
        {question.title}
      </h2>

      {question.subtitle && (
        <p className="text-[14px] text-gray-dark leading-relaxed mb-6">
          {question.subtitle}
        </p>
      )}

      {question.type === 'text_fields'     && <TextFieldsInput   question={question} />}
      {question.type === 'single'          && <SingleChoiceInput question={question} onSelect={onSelect} />}
      {question.type === 'multiple'        && <MultiChoiceInput  question={question} />}
      {question.type === 'multiple_upload' && <UploadInput       question={question} />}
      {question.type === 'textarea_only'   && <TextAreaInput     question={question} />}
    </div>
  )
}
