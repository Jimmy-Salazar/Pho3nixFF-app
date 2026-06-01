const statusStyles = {
  borrador: "border-zinc-500/30 bg-zinc-500/10 text-zinc-300",
  activa: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  cerrada: "border-red-500/30 bg-red-500/10 text-red-300",
  abierto: "border-orange-500/30 bg-orange-500/10 text-orange-300",
  cerrado: "border-red-500/30 bg-red-500/10 text-red-300",
  inscrito: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  retirado: "border-red-500/30 bg-red-500/10 text-red-300",
};

export default function StatusBadge({ status, compact = false }) {
  const label = status || "sin estado";

  return (
    <span
      className={[
        "inline-flex items-center rounded-full border font-bold uppercase tracking-wide",
        compact ? "px-2 py-1 text-[10px]" : "px-3 py-1 text-xs",
        statusStyles[status] || "border-white/10 bg-white/5 text-zinc-300",
      ].join(" ")}
    >
      {label}
    </span>
  );
}