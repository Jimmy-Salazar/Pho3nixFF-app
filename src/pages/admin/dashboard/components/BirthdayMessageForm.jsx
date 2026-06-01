import { formatDateISO } from "../utils/dashboardUtils"

export default function BirthdayMessageForm({
  currentUser,
  todaysBirthdays,
  upcomingBirthdayTargets,
  birthdayMessages,
  messageDrafts,
  setMessageDrafts,
  submittingMessage,
  messageNotice,
  onSubmitBirthdayMessage,
}) {
  const currentUserId = currentUser?.id || null

  const todaysTargets = (todaysBirthdays || []).filter(
    (item) => item.id !== currentUserId
  )

  const upcomingTargets = (upcomingBirthdayTargets || []).filter(
    (item) => item.id !== currentUserId
  )

  const candidates = [...todaysTargets, ...upcomingTargets]
  const mainTarget = candidates[0] || null

  const existingMessage = mainTarget
    ? (birthdayMessages || []).find(
        (item) =>
          item.cumpleanero_id === mainTarget.id &&
          item.autor_id === currentUserId &&
          item.fecha_cumpleanos === formatDateISO(mainTarget.nextBirthday)
      )
    : null

  const value = mainTarget ? messageDrafts[mainTarget.id] || "" : ""
  const remaining = 150 - value.length

  const isTodayTarget = mainTarget?.daysUntil === 0

  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.025] p-4 lg:min-h-[230px]">
      <div className="text-xs font-bold uppercase tracking-[0.18em] text-purple-200">
        {isTodayTarget ? "Mensaje para el cumpleañero" : "Mensaje anticipado"}
      </div>

      {mainTarget ? (
        existingMessage ? (
          <div className="mt-4">
            <p className="text-sm font-bold text-white">
              Ya dejaste tu mensaje para {mainTarget.nombre}
            </p>

            <div className="mt-4 rounded-2xl border border-orange-400/20 bg-orange-500/10 p-4">
              <p className="text-sm leading-6 text-white/75">
                “{existingMessage.mensaje}”
              </p>
              <p className="mt-3 text-xs font-bold text-orange-200">
                — {currentUser?.nombre || "Tú"}
              </p>
            </div>

            <p className="mt-3 text-xs leading-5 text-white/45">
              Cada usuario puede dejar un solo mensaje de hasta 150 caracteres por cumpleaños.
            </p>
          </div>
        ) : (
          <div className="mt-4">
            <p className="text-sm font-bold text-white">
              Puedes dejarle un mensaje a {mainTarget.nombre}
            </p>

            <span className="mt-2 inline-flex rounded-full bg-white/10 px-3 py-1 text-[11px] text-white/60">
              {isTodayTarget ? "Cumpleaños de hoy" : `Faltan ${mainTarget.daysUntil} día(s)`}
            </span>

            <textarea
              value={value}
              maxLength={150}
              onChange={(e) =>
                setMessageDrafts((prev) => ({
                  ...prev,
                  [mainTarget.id]: e.target.value,
                }))
              }
              placeholder="Máximo 150 caracteres..."
              className="mt-4 min-h-[90px] w-full resize-none rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-orange-400/40"
            />

            <div className="mt-3 flex items-center justify-between gap-3">
              <span
                className={[
                  "text-[11px]",
                  remaining < 15 ? "text-amber-300" : "text-white/40",
                ].join(" ")}
              >
                {remaining} caracteres restantes
              </span>

              <button
                type="button"
                disabled={submittingMessage === mainTarget.id}
                onClick={() => onSubmitBirthdayMessage(mainTarget)}
                className="rounded-xl bg-orange-500 px-5 py-3 text-xs font-black text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submittingMessage === mainTarget.id ? "Guardando..." : "Guardar"}
              </button>
            </div>

            {messageNotice ? (
              <p className="mt-2 text-xs text-white/60">{messageNotice}</p>
            ) : null}
          </div>
        )
      ) : (
        <p className="mt-4 text-sm leading-6 text-white/55">
          Cuando haya un cumpleaños hoy o falten 5 días para uno, aquí podrás dejar una dedicatoria.
        </p>
      )}
    </div>
  )
}
