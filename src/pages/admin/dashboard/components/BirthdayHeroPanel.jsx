import BirthdayMessageForm from "./BirthdayMessageForm"
import BirthdayMessageCarousel from "./BirthdayMessageCarousel"
import { getInitials } from "../utils/dashboardUtils"

export default function BirthdayHeroPanel({
  heroBirthday,
  currentUser,
  todayWod,
  nextEvent,
  alumnoExpiringRows,
  alumnoExpiringLabel,
  todaysBirthdays,
  upcomingBirthdayTargets,
  birthdayMessages,
  messageDrafts,
  setMessageDrafts,
  submittingMessage,
  messageNotice,
  onSubmitBirthdayMessage,
}) {
  const initials = getInitials(heroBirthday?.nombre)
  const birthdayName = heroBirthday?.nombre || "Sin cumpleañero hoy"

  return (
    <div className="relative min-h-full overflow-hidden rounded-[1.7rem] border border-white/10 bg-[#060910]/90 p-4 sm:p-5 md:p-6">
      <div className="absolute -left-28 top-16 h-80 w-80 rounded-full bg-orange-500/10 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-purple-500/10 blur-3xl" />

      <div className="relative z-10">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="inline-flex items-center gap-3 text-sm font-black uppercase tracking-[0.22em] text-orange-300">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-orange-500/10 text-2xl shadow-[0_0_22px_rgba(249,115,22,0.22)]">
              🔥
            </span>
            En PHO3NIX celebramos a nuestra comunidad.
          </div>

          {alumnoExpiringRows.length > 0 ? (
            <div className="hidden rounded-2xl border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-200 sm:inline-flex">
              💳 {alumnoExpiringLabel}
            </div>
          ) : null}
        </div>

        <div className="mt-6">
          <div className="text-xs font-black uppercase tracking-[0.22em] text-orange-300">
            Cumpleañero del día
          </div>

          <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-[150px_minmax(240px,1fr)_330px] xl:grid-cols-[170px_minmax(280px,1fr)_350px] lg:items-center">
            <div className="relative mx-auto flex h-36 w-36 shrink-0 items-center justify-center overflow-visible rounded-full lg:mx-0 lg:h-36 lg:w-36 xl:h-40 xl:w-40">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-orange-500 via-pink-500 to-purple-500 opacity-85 shadow-[0_0_38px_rgba(249,115,22,0.38)]" />
              <div className="absolute -inset-3 rounded-full border border-orange-400/10" />
              <div className="absolute -inset-5 rounded-full bg-orange-500/10 blur-xl" />

              <div className="relative z-10 h-[92%] w-[92%] overflow-hidden rounded-full border border-white/10 bg-slate-950">
                {heroBirthday?.foto_url ? (
                  <img
                    src={heroBirthday.foto_url}
                    alt={heroBirthday.nombre || "Cumpleañero del día"}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none"
                    }}
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center">
                    <div className="text-4xl font-black text-orange-200">
                      {heroBirthday ? initials : "🎂"}
                    </div>
                    <div className="mt-1 text-[9px] font-bold uppercase tracking-[0.16em] text-white/45">
                      PHO3NIX
                    </div>
                  </div>
                )}
              </div>

              {heroBirthday ? (
                <div className="absolute right-0 top-1 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-orange-400 text-base shadow-[0_0_18px_rgba(251,146,60,0.85)]">
                  🎂
                </div>
              ) : null}
            </div>

            <div className="min-w-0 text-center lg:text-left">
              <h2 className="text-4xl font-black leading-[1.05] tracking-tight text-white lg:text-4xl xl:text-5xl">
                {birthdayName}
              </h2>

              {heroBirthday ? (
                <p className="mt-3 text-base font-black text-orange-400">
                  ¡Feliz cumpleaños! 🎂
                </p>
              ) : (
                <p className="mt-3 text-base font-black text-orange-400">
                  Hoy no hay cumpleaños registrados
                </p>
              )}

              <p className="mt-4 max-w-sm text-sm leading-7 text-white/70">
                {heroBirthday
                  ? "Que tengas un día increíble rodeado de buenas energías y muchos PRs."
                  : "Cuando haya cumpleañero, aparecerá aquí junto con los mensajes que le dejaron sus compañeros."}
              </p>

              {heroBirthday ? (
                <a
                  href="#birthday-messages"
                  className="mt-5 inline-flex items-center gap-2 rounded-xl border border-orange-400/60 bg-orange-500/10 px-5 py-3 text-sm font-black text-orange-300 transition hover:bg-orange-500/20"
                >
                  💬 Ver mensajes ({birthdayMessages?.length || 0})
                </a>
              ) : null}
            </div>

            <BirthdayMessageForm
              currentUser={currentUser}
              todaysBirthdays={todaysBirthdays}
              upcomingBirthdayTargets={upcomingBirthdayTargets}
              birthdayMessages={birthdayMessages}
              messageDrafts={messageDrafts}
              setMessageDrafts={setMessageDrafts}
              submittingMessage={submittingMessage}
              messageNotice={messageNotice}
              onSubmitBirthdayMessage={onSubmitBirthdayMessage}
            />
          </div>
        </div>

        {todaysBirthdays.length > 0 ? (
          <BirthdayMessageCarousel
            todaysBirthdays={todaysBirthdays}
            birthdayMessages={birthdayMessages}
          />
        ) : null}
      </div>
    </div>
  )
}
