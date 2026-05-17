export default function Navbar({ stepLabel }) {
  return (
    <nav className="bg-white border-b border-gray-border h-[60px] flex items-center px-6 gap-3 sticky top-0 z-10">
      <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
        C
      </div>
      <span className="text-[15px] font-semibold text-navy">Build with Claude</span>
      <div className="flex-1" />
      {stepLabel && (
        <span className="text-[13px] text-gray-dark">{stepLabel}</span>
      )}
    </nav>
  )
}
