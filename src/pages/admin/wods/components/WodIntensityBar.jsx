// src/pages/admin/wods/components/WodIntensityBar.jsx

export default function WodIntensityBar({ icon, label, value }) {
  const safeValue = Math.max(0, Math.min(100, Number(value) || 0))

  return (
    <div className="mb-3 grid grid-cols-[90px_1fr_42px] items-center gap-3">
      <div className="flex items-center gap-2 text-sm font-bold text-white/70">
        <span className="text-lg">{icon}</span>
        {label}
      </div>

      <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-orange-500 shadow-[0_0_12px_rgba(249,115,22,.65)]"
          style={{ width: `${safeValue}%` }}
        />
      </div>

      <div className="text-right text-sm font-black text-white/80">
        {safeValue}%
      </div>
    </div>
  )
}
