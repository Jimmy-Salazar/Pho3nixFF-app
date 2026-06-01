export default function MonthBirthdayCalendar({
  birthdaysThisMonth,
  birthdayCarouselRef,
}) {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()

  const monthLabel = new Intl.DateTimeFormat("es-EC", {
    month: "long",
    year: "numeric",
  }).format(today)

  const firstDay = new Date(year, month, 1)
  const totalDays = new Date(year, month + 1, 0).getDate()
  const startOffset = (firstDay.getDay() + 6) % 7

  const birthdayMap = new Map()

  for (const item of birthdaysThisMonth || []) {
    const list = birthdayMap.get(item.birthDay) || []
    list.push(item)
    birthdayMap.set(item.birthDay, list)
  }

  const cells = []

  for (let i = 0; i < startOffset; i += 1) {
    cells.push({ type: "empty", key: `empty-${i}` })
  }

  for (let day = 1; day <= totalDays; day += 1) {
    const birthdays = birthdayMap.get(day) || []
    const isToday = day === today.getDate()
    const hasBirthday = birthdays.length > 0

    cells.push({
      type: "day",
      key: `day-${day}`,
      day,
      isToday,
      hasBirthday,
      isBirthdayToday: isToday && hasBirthday,
      birthdays,
    })
  }

  const nextBirthdays = [...(birthdaysThisMonth || [])]
    .sort((a, b) => {
      if (a.daysUntil !== b.daysUntil) return a.daysUntil - b.daysUntil
      return a.birthDay - b.birthDay
    })
    .slice(0, 5)

  return (
    <div className="min-w-0 rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-3 backdrop-blur-xl sm:p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.22em] text-orange-300">
            Calendario
          </div>

          <h3 className="mt-1 text-lg font-black capitalize text-white sm:text-xl">
            {monthLabel}
          </h3>
        </div>

        <div className="rounded-xl border border-purple-400/20 bg-purple-500/10 px-3 py-2 text-right">
          <div className="text-lg font-black text-purple-100">
            {birthdaysThisMonth?.length || 0}
          </div>
          <div className="text-[10px] uppercase tracking-[0.16em] text-purple-200/70">
            Cumples
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[9px] font-black uppercase tracking-[0.08em] text-white/35">
        <div>L</div>
        <div>M</div>
        <div>M</div>
        <div>J</div>
        <div>V</div>
        <div>S</div>
        <div>D</div>
      </div>

      <div className="mt-2 grid grid-cols-7 gap-1">
        {cells.map((cell) => {
          if (cell.type === "empty") {
            return <div key={cell.key} className="aspect-square min-h-[34px]" />
          }

          return (
            <div
              key={cell.key}
              title={
                cell.hasBirthday
                  ? cell.birthdays.map((x) => x.nombre).join(", ")
                  : undefined
              }
              className={[
                "relative flex aspect-square min-h-[30px] items-center justify-center overflow-visible rounded-lg border text-[10px] font-black transition duration-300 sm:min-h-[36px] sm:text-[11px]",
                cell.isBirthdayToday
                  ? "border-orange-300/70 bg-orange-500/30 text-orange-50 shadow-[0_0_34px_rgba(249,115,22,0.35)] animate-pulse"
                  : "",
                cell.hasBirthday && !cell.isToday
                  ? "border-orange-300/50 bg-orange-500/20 text-orange-100 shadow-[0_0_24px_rgba(249,115,22,0.16)]"
                  : "",
                cell.isToday && !cell.hasBirthday
                  ? "border-purple-300/60 bg-purple-500/25 text-purple-50 shadow-[0_0_24px_rgba(168,85,247,0.22)]"
                  : "",
                !cell.hasBirthday && !cell.isToday
                  ? "border-white/10 bg-black/20 text-white/55 hover:border-white/20 hover:bg-white/[0.06]"
                  : "",
              ].join(" ")}
            >
              {cell.isBirthdayToday ? (
                <>
                  <span className="absolute -top-1.5 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-orange-300 shadow-[0_0_18px_rgba(251,191,36,0.9)]" />
                  <span className="absolute inset-[-3px] rounded-xl border border-orange-300/30" />
                </>
              ) : null}

              {cell.day}

              {cell.hasBirthday ? (
                <span
                  className={[
                    "absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full text-[8px] text-black sm:h-4 sm:w-4 sm:text-[9px]",
                    cell.isBirthdayToday
                      ? "bg-orange-300 shadow-[0_0_16px_rgba(251,191,36,0.8)]"
                      : "bg-purple-400",
                  ].join(" ")}
                >
                  🎂
                </span>
              ) : null}
            </div>
          )
        })}
      </div>

      <div className="mt-3 flex flex-wrap gap-3 text-[11px]">
        <div className="inline-flex items-center gap-2 text-white/65">
          <span className="h-2.5 w-2.5 rounded-full bg-orange-400 shadow-[0_0_12px_rgba(251,146,60,0.7)]" />
          Cumpleaños
        </div>

        <div className="inline-flex items-center gap-2 text-white/65">
          <span className="h-2.5 w-2.5 rounded-full bg-purple-400 shadow-[0_0_12px_rgba(192,132,252,0.7)]" />
          Hoy
        </div>

        <div className="inline-flex items-center gap-2 text-white/65">
          <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-r from-orange-400 to-purple-400 shadow-[0_0_12px_rgba(251,146,60,0.7)]" />
          Cumpleaños de hoy
        </div>
      </div>

      <div className="mt-4 border-t border-white/10 pt-3">
        <div className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-white/70">
          🎂 Próximos cumpleaños
        </div>

        {nextBirthdays.length ? (
          <div
            ref={birthdayCarouselRef}
            className="flex gap-2 overflow-x-auto pb-2 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {nextBirthdays.map((item) => {
              const isToday = item.daysUntil === 0

              return (
                <div
                  key={item.id}
                  data-news-card
                  className={[
                    "snap-start flex min-h-[88px] w-[138px] shrink-0 flex-col justify-between rounded-2xl border p-2.5",
                    isToday
                      ? "border-orange-300/40 bg-orange-500/15 shadow-[0_0_18px_rgba(249,115,22,0.18)]"
                      : "border-white/10 bg-black/20",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div
                      className={[
                        "flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-full border text-[9px] font-black",
                        isToday
                          ? "border-orange-300/60 bg-orange-500/20 text-orange-100 shadow-[0_0_18px_rgba(249,115,22,0.22)]"
                          : "border-orange-400/30 bg-orange-500/10 text-orange-200",
                      ].join(" ")}
                    >
                      <span className="text-sm leading-none">
                        {item.birthDay}
                      </span>
                      <span className="text-[8px] uppercase text-white/45">
                        {new Intl.DateTimeFormat("es-EC", {
                          month: "short",
                        })
                          .format(new Date(year, month, item.birthDay))
                          .replace(".", "")}
                      </span>
                    </div>

                    <span className="text-base">🎂</span>
                  </div>

                  <div className="mt-3 min-w-0">
                    <div className="truncate text-xs font-bold text-white">
                      {item.nombre}
                    </div>
                    <div className="text-[11px] text-white/50">
                      {isToday ? "Hoy" : `En ${item.daysUntil} día(s)`}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-xs text-white/45">
            No hay cumpleaños registrados este mes.
          </p>
        )}
      </div>
    </div>
  )
}
