import { useState } from 'react'

function downloadMd(filename, content) {
  const blob = new Blob([content], { type: 'text/markdown' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function DocCard({ title, filename, content }) {
  const [copied, setCopied] = useState(false)
  const [expanded, setExpanded] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  // Render markdown as plain text in the preview block
  // Full markdown rendering comes later; for now monospace is readable
  const preview = expanded ? content : content.slice(0, 800) + (content.length > 800 ? '\n\n...' : '')

  return (
    <div className="border border-gray-border rounded-md overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 bg-gray-bg border-b border-gray-border">
        <span className="font-semibold text-[15px] text-navy">{title}</span>
        <div className="flex items-center gap-2">
          {copied && <span className="text-[12px] text-green-600 font-medium">✓ Copied!</span>}
          <button
            onClick={handleCopy}
            className="text-[13px] text-gray-dark hover:text-navy border border-gray-border
                       bg-white rounded px-3 py-1.5 transition-colors duration-150"
          >
            Copy
          </button>
          <button
            onClick={() => downloadMd(filename, content)}
            className="text-[13px] text-primary hover:text-primary-hover border border-primary/30
                       bg-blue-light rounded px-3 py-1.5 transition-colors duration-150 font-medium"
          >
            ↓ .md
          </button>
        </div>
      </div>

      {/* Content preview */}
      <div
        className="bg-[#091E42] text-[#C7D1E0] p-5 font-mono text-[12px] leading-relaxed
                   whitespace-pre-wrap break-words"
        style={{ maxHeight: expanded ? 'none' : '260px', overflowY: expanded ? 'visible' : 'hidden' }}
      >
        {preview}
      </div>

      {/* Expand / collapse */}
      {content.length > 800 && (
        <button
          onClick={() => setExpanded(e => !e)}
          className="w-full text-center text-[13px] text-primary hover:text-primary-hover
                     py-2.5 border-t border-gray-border bg-white transition-colors duration-150"
        >
          {expanded ? '↑ Show less' : '↓ Show full document'}
        </button>
      )}
    </div>
  )
}
