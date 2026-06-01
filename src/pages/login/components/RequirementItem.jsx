// src/pages/login/components/RequirementItem.jsx

export default function RequirementItem({ ok, text }) {
  return (
    <div className="flex items-center gap-2 text-white/75">
      <span
        className={[
          "flex h-5 w-5 items-center justify-center rounded-full border text-[11px] font-black",
          ok
            ? "border-orange-500 bg-orange-500/15 text-orange-300"
            : "border-white/15 bg-white/5 text-white/30",
        ].join(" ")}
      >
        ✓
      </span>
      <span>{text}</span>
    </div>
  )
}
