export default function BirthdaysPanel({ items, loading }) {
  return (
    <article className="rounded-[2rem] border border-white/10 bg-black/45 p-5 shadow-2xl shadow-black/30">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-400">
            🎂 Próximos cumpleaños
          </p>

          <h3 className="mt-1 text-xl font-black text-white">
            Comunidad
          </h3>
        </div>
      </div>

      {loading ? (
        <Empty text="Cargando cumpleaños..." />
      ) : items.length === 0 ? (
        <Empty text="No hay cumpleaños registrados este mes." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-3">
          {items.slice(0, 3).map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-orange-500/25 bg-orange-500/10 text-lg font-black text-orange-300">
                {getInitials(item.nombre)}
              </div>

              <p className="mt-3 truncate text-sm font-black text-white">
                {item.nombre}
              </p>

              <p className="mt-1 text-xs text-white/45">
                {item.day} de {item.monthLabel}
              </p>

              <p className="mt-2 text-lg">🎂</p>
            </article>
          ))}
        </div>
      )}
    </article>
  )
}

function Empty({ text }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 bg-black/25 p-4 text-sm text-white/40">
      {text}
    </div>
  )
}

function getInitials(name) {
  const parts = String(name || "PH").trim().split(/\s+/).filter(Boolean)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0]?.[0] || "P"}${parts[1]?.[0] || "H"}`.toUpperCase()
}