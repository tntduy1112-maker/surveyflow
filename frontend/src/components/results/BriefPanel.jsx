import { useState } from 'react'

export default function BriefPanel({ brief }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(brief).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div>
      {/* Instructions */}
      <div className="bg-blue-light border border-blue-mid rounded-md p-4 mb-5 text-[14px] text-navy leading-relaxed">
        <p className="font-semibold mb-2">How to use with Claude Code:</p>
        <ol className="list-decimal list-inside space-y-1 text-[13px]">
          <li>Copy the brief below</li>
          <li>Open a new Claude Code session and paste it</li>
          <li>Type <code className="bg-white/60 px-1.5 py-0.5 rounded text-[12px] font-mono">/business-case</code> to start the full build pipeline</li>
        </ol>
      </div>

      {/* Brief output block */}
      <div
        className="bg-[#091E42] text-[#C7D1E0] rounded-md p-5 font-mono text-[12.5px] leading-relaxed
                   whitespace-pre-wrap break-words max-h-[420px] overflow-y-auto mb-2"
      >
        {brief}
      </div>

      {/* Actions */}
      <div className="flex justify-end items-center gap-3">
        {copied && (
          <span className="text-[13px] text-green-600 font-medium">✓ Copied!</span>
        )}
        <button onClick={handleCopy} className="btn-secondary text-[14px] px-4 py-2 min-h-[38px]">
          Copy to clipboard
        </button>
      </div>
    </div>
  )
}
