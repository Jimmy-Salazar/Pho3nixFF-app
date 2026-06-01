export default function PhoenixTimeline({
  todaysBirthdays,
  eventosBox,
  alumnoExpiringRows,
  alumnoExpiringLabel,
}) {
  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold text-white/85">Timeline del box</h2>

      <div className="mt-4 space-y-4 border-l border-orange-500/25 pl-5">
        {todaysBirthdays.length > 0 ? (
          todaysBirthdays.map((item) => (
            <TimelineItem
              key={`birthday-${item.id}`}
              icon="🎂"
              title={`${item.nombre} está de cumpleaños`}
              text="Hoy la comunidad PHO3NIX celebra un cumpleaños."
            />
          ))
        ) : (
          <TimelineItem
            icon="🎂"
            title="Sin cumpleañeros hoy"
            text="Los cumpleaños del mes aparecen en el calendario superior."
          />
        )}

        {eventosBox.length > 0 ? (
          eventosBox.map((item) => (
            <TimelineItem
              key={`event-${item.id}`}
              icon="📢"
              title={item.titulo || "Evento PHO3NIX"}
              text={item.descripcion || "Evento agregado por el equipo del box."}
            />
          ))
        ) : (
          <TimelineItem
            icon="📢"
            title="Sin eventos activos"
            text="Cuando el coach o admin agregue eventos, aparecerán aquí."
          />
        )}

        {alumnoExpiringRows.length > 0 ? (
          <TimelineItem
            icon="💳"
            title="Mensualidad por vencer"
            text={alumnoExpiringLabel}
          />
        ) : null}
      </div>
    </section>
  )
}

function TimelineItem({ icon, title, text }) {
  return (
    <div className="relative">
      <div className="absolute -left-[31px] top-1 flex h-7 w-7 items-center justify-center rounded-full border border-orange-400/30 bg-slate-950 text-sm">
        {icon}
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
        <h3 className="font-bold text-white">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-white/60">{text}</p>
      </div>
    </div>
  )
}
