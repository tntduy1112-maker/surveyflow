export default function NavButtons({ onBack, onNext, isFirst, isLast, isSubmitting }) {
  return (
    <div className="flex justify-between items-center mt-8 gap-3">
      <button
        onClick={onBack}
        disabled={isFirst}
        className="btn-ghost disabled:opacity-30 disabled:cursor-not-allowed"
      >
        ← Back
      </button>

      <button
        onClick={onNext}
        disabled={isSubmitting}
        className="btn-primary"
      >
        {isSubmitting ? 'Generating...' : isLast ? 'Generate Brief →' : 'Next →'}
      </button>
    </div>
  )
}
