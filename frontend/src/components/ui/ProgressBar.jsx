export default function ProgressBar({ current, total }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0
  return (
    <div className="mb-7">
      <div className="flex justify-between text-[13px] text-gray-dark mb-2">
        <span>Question {current + 1} of {total}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-[5px] bg-gray-border rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-[width] duration-300 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
