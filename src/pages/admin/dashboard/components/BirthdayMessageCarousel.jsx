import { getInitials } from "../utils/dashboardUtils"

export default function BirthdayMessageCarousel({ todaysBirthdays, birthdayMessages }) {
  const todayBirthdayIds = new Set((todaysBirthdays || []).map((item) => item.id))
  const todayMessages = (birthdayMessages || []).filter((item) =>
    todayBirthdayIds.has(item.cumpleanero_id)
  )

  const targetName = todaysBirthdays?.[0]?.nombre || "hoy"

  return (
    <div id="birthday-messages" className="mt-7 rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="text-xs font-black uppercase tracking-[0.2em] text-white/55">
          💬 Mensajes para {targetName}
        </div>

        <div className="text-sm font-bold text-white/75">
          {todayMessages.length} mensaje(s)
        </div>
      </div>

      {todaysBirthdays?.length ? (
        todayMessages.length ? (
          <>
            <div className="flex gap-3 overflow-x-auto pb-3 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {todayMessages.map((item) => (
                <div
                  key={item.id}
                  data-birthday-message-card
                  className="snap-start min-h-[150px] w-[230px] shrink-0 rounded-3xl border border-white/10 bg-white/[0.05] p-4 sm:w-[260px]"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-orange-400/20 bg-orange-500/15 text-[11px] font-black text-orange-100">
                      {getInitials(item.autor_nombre)}
                    </div>

                    <div className="min-w-0">
                      <div className="truncate text-xs font-bold text-white">
                        {item.autor_nombre}
                      </div>
                      <div className="text-[10px] text-white/35">
                        Comunidad PHO3NIX
                      </div>
                    </div>
                  </div>

                  <p className="mt-4 line-clamp-4 text-sm leading-6 text-white/75">
                    “{item.mensaje}”
                  </p>
                </div>
              ))}
            </div>

            <div className="flex justify-center gap-2">
              {todayMessages.slice(0, 5).map((item, index) => (
                <span
                  key={item.id || index}
                  className={[
                    "h-2 w-2 rounded-full",
                    index === 0 ? "bg-orange-500" : "bg-white/25",
                  ].join(" ")}
                />
              ))}
            </div>
          </>
        ) : (
          <p className="text-sm leading-6 text-white/55">
            Hoy hay cumpleañero, pero todavía no tiene mensajes guardados.
          </p>
        )
      ) : (
        <p className="text-sm leading-6 text-white/55">
          Cuando sea el cumpleaños de un alumno, aquí aparecerán las dedicatorias firmadas por sus compañeros.
        </p>
      )}
    </div>
  )
}
