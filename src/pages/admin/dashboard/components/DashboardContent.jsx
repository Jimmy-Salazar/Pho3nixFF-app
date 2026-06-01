import BirthdayCalendar from "./BirthdayCalendar"

export default function DashboardContent({
  statItems,
  quickActions,
  recentNews,
  expiringRows,
  birthdayRows,
  todayWod,
  todayWodLoading,
  navigate,
  openDetailModal,
  setSelectedNews,
  formatHumanDate,
  translateNewsTitle,
}) {
  return (
    <main className="phoenix-page min-w-0 overflow-hidden p-5">
      <div className="grid h-full grid-rows-[auto_auto_auto_1fr_auto] gap-4 overflow-hidden">
        <HeaderRow formatHumanDate={formatHumanDate} />

        <section className="grid grid-cols-4 gap-3">
		{statItems.map(({ key, ...item }) => (
		  <StatBox key={key} {...item} />
		))}
        </section>

        <section className="phoenix-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-black text-white">⚡ Acciones rápidas</h3>
            <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/35">
              Gestión diaria
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {quickActions.map((item) => (
              <button
                key={item.title}
                type="button"
                onClick={item.onClick}
                className="group flex min-h-[74px] items-center gap-4 rounded-2xl border border-white/10 bg-black/20 px-5 py-3 text-left transition hover:-translate-y-0.5 hover:border-orange-400/40 hover:bg-orange-500/10"
              >
                <div className="text-3xl text-orange-400">{item.icon}</div>
                <div>
                  <div className="text-lg font-black leading-tight text-white">{item.title}</div>
                  <div className="mt-1 hidden text-xs text-white/45 xl:block">{item.text}</div>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="grid min-h-0 grid-cols-3 gap-3 overflow-hidden">
          <Panel title="Anuncios recientes" action="Ver todos" onAction={() => recentNews?.[0] && setSelectedNews(recentNews[0])}>
            {recentNews.length ? (
              recentNews.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedNews(item)}
                  className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-3 text-left transition hover:border-orange-400/40 hover:bg-orange-500/10"
                >
                  {item.imagen_url ? (
                    <img
                      src={item.imagen_url}
                      alt={item.titulo}
                      className="h-12 w-20 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-20 items-center justify-center rounded-xl bg-orange-500/10 text-xl">
                      📣
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold text-white">
                      {translateNewsTitle(item.titulo)}
                    </div>
                    <div className="mt-1 text-xs text-white/45">
                      {item.fecha_publicacion ? formatHumanDate(item.fecha_publicacion) : "Sin fecha"}
                    </div>
                  </div>

                  <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-[11px] font-bold text-emerald-300">
                    Activo
                  </span>
                </button>
              ))
            ) : (
              <EmptyPanel text="No hay anuncios recientes." />
            )}
          </Panel>

          <Panel title="Próximos vencimientos" action="Ver todos" onAction={() => openDetailModal("vencimientos")}>
            {expiringRows.length ? (
              expiringRows.map((item) => (
                <div
                  key={`${item.id}-${item.fechaFin}`}
                  className="flex items-center justify-between gap-3 rounded-2xl border-b border-white/10 p-3"
                >
                  <div>
                    <div className="text-sm font-bold text-white">{item.nombre}</div>
                    <div className="text-xs text-white/45">{item.email || "Alumno PHO3NIX"}</div>
                  </div>

                  <div className="text-right text-sm font-black text-orange-400">
                    {item.fechaFin}
                    <div className="text-xs font-semibold text-orange-300/75">
                      {item.diffDays === 0 ? "Hoy" : `en ${item.diffDays} días`}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <EmptyPanel text="No hay vencimientos próximos." />
            )}
          </Panel>

          <div className="phoenix-card min-h-0 overflow-hidden p-4">
            <BirthdayCalendar birthdayRows={birthdayRows} />
          </div>
        </section>

        <section className="phoenix-card px-5 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
              <div className="text-3xl">🏆</div>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-white">
                  WOD del día:{" "}
                  <span className="text-orange-300">
                    {todayWodLoading ? "Cargando..." : todayWod?.nombre || "Sin WOD publicado"}
                  </span>
                </div>
                <div className="truncate text-xs text-white/45">
                  {todayWod?.descripcion || "El resumen del entrenamiento publicado aparecerá aquí."}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                navigate("/wods", {
                  state: { openTodayWodModal: true },
                })
              }
              className="shrink-0 rounded-xl border border-orange-500/40 bg-orange-500 px-4 py-2 text-xs font-black uppercase text-black transition hover:bg-orange-400"
            >
              Ver WOD →
            </button>
          </div>
        </section>
      </div>
    </main>
  )
}

function HeaderRow({ formatHumanDate }) {
  return (
    <section className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-white">
          ¡Bienvenido, Coach! 🔥
        </h1>
        <p className="mt-1 text-base text-white/55">
          Aquí tienes un resumen rápido de lo que sucede en PHO3NIX.
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white/80">
          📅 <span className="ml-2">{formatHumanDate(new Date())}</span>
        </div>

        <div className="flex items-center gap-3 border-l border-white/10 pl-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-orange-500/35 bg-orange-500/10">
            🔥
          </div>
          <div>
            <div className="text-sm font-black text-white">Coach</div>
            <div className="text-xs text-white/50">Administrador</div>
          </div>
        </div>
      </div>
    </section>
  )
}

function StatBox({
  icon,
  title,
  value,
  subtitle,
  tone = "orange",
  action,
  onClick,
}) {
  const toneClass = {
    orange: "bg-orange-500/15 text-orange-300",
    amber: "bg-amber-500/15 text-amber-300",
    purple: "bg-purple-500/15 text-purple-300",
    blue: "bg-blue-500/15 text-blue-300",
  }[tone]

  const actionClass = {
    orange: "text-orange-300",
    amber: "text-amber-300",
    purple: "text-purple-300",
    blue: "text-blue-300",
  }[tone]

  return (
    <button
      type="button"
      onClick={onClick}
      className="phoenix-card group min-h-[132px] p-5 text-left transition hover:-translate-y-0.5"
    >
      <div className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl ${toneClass} text-3xl`}>
        {icon}
      </div>

      <div className="mt-3 flex items-end gap-3">
        <div className="text-4xl font-black leading-none text-white">{value}</div>
        <div className="pb-0.5 text-sm font-semibold leading-5 text-white/80">{title}</div>
      </div>

      <div className="mt-3 text-sm text-white/45">{subtitle}</div>

      {action ? (
        <div className={`mt-3 text-sm font-black ${actionClass}`}>
          {action} →
        </div>
      ) : null}
    </button>
  )
}

function Panel({ title, action, onAction, children }) {
  return (
    <div className="phoenix-card min-h-0 overflow-hidden p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-lg font-black text-white">{title}</h3>
        <button
          type="button"
          onClick={onAction}
          className="rounded-xl border border-white/10 px-3 py-1.5 text-xs font-bold text-white/70 transition hover:border-orange-400/40 hover:text-orange-300"
        >
          {action}
        </button>
      </div>

      <div className="space-y-2 overflow-hidden">{children}</div>
    </div>
  )
}

function EmptyPanel({ text }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-4 text-sm text-white/45">
      {text}
    </div>
  )
}
