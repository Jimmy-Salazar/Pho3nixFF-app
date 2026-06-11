// src/pages/admin/wods/components/WodIntensityBar.jsx

export default function WodIntensityBar({ icon, label, value }) {
  const safeValue = Math.max(0, Math.min(100, Number(value) || 0))

  return (
    <div className="mb-2 grid grid-cols-[68px_1fr_34px] items-center gap-2">
      <div className="flex items-center gap-1.5 text-[10px] font-bold text-white/70">
        <span className="text-sm">{icon}</span>
        {label}
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-orange-500 shadow-[0_0_12px_rgba(249,115,22,.65)]"
          style={{ width: `${safeValue}%` }}
        />
      </div>

      <div className="text-right text-[10px] font-black text-white/80">
        {safeValue}%
      </div>
    </div>
  )
}
