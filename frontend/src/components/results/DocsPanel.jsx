import DocCard from './DocCard'

const DOCS = [
  { key: 'product_spec',    title: 'Product Spec',     filename: 'product-spec.md' },
  { key: 'user_stories',    title: 'User Stories',     filename: 'user-stories.md' },
  { key: 'deployment_plan', title: 'Deployment Plan',  filename: 'deployment-plan.md' },
  { key: 'test_cases',      title: 'Test Cases',       filename: 'test-cases.md' },
]

export default function DocsPanel({ output }) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-[13px] text-gray-dark leading-relaxed">
        Four AI-generated documents based on your survey answers. Copy or download each one, then paste into Codex, Gemini, or any other AI tool to start building.
      </p>

      {DOCS.map(({ key, title, filename }) => {
        const content = output[key]
        if (!content) {
          return (
            <div key={key} className="border border-gray-border rounded-md p-4 text-[13px] text-gray-medium">
              {title} — not generated yet
            </div>
          )
        }
        return (
          <DocCard
            key={key}
            title={title}
            filename={filename}
            content={content}
          />
        )
      })}
    </div>
  )
}
