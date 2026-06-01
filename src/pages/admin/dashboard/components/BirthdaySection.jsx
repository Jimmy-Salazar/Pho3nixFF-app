import MonthBirthdayCalendar from "./MonthBirthdayCalendar"
import BirthdayHeroPanel from "./BirthdayHeroPanel"

export default function BirthdaySection({
  currentUser,
  heroBirthday,
  birthdaysThisMonth,
  todaysBirthdays,
  upcomingBirthdayTargets,
  birthdayMessages,
  messageDrafts,
  setMessageDrafts,
  submittingMessage,
  messageNotice,
  onSubmitBirthdayMessage,
  alumnoExpiringRows,
  alumnoExpiringLabel,
  birthdayCarouselRef,
}) {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-black/35 p-3 shadow-2xl sm:p-4 md:p-5">
      <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-orange-500/20 blur-3xl" />
      <div className="absolute -bottom-24 left-8 h-72 w-72 rounded-full bg-red-500/10 blur-3xl" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(249,115,22,0.14),transparent_32%),radial-gradient(circle_at_20%_100%,rgba(239,68,68,0.10),transparent_28%)]" />

      <div className="relative z-10 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(780px,1fr)_390px] xl:grid-cols-[minmax(860px,1fr)_400px] lg:items-stretch">
        <BirthdayHeroPanel
          heroBirthday={heroBirthday}
          currentUser={currentUser}
          alumnoExpiringRows={alumnoExpiringRows}
          alumnoExpiringLabel={alumnoExpiringLabel}
          todaysBirthdays={todaysBirthdays}
          upcomingBirthdayTargets={upcomingBirthdayTargets}
          birthdayMessages={birthdayMessages}
          messageDrafts={messageDrafts}
          setMessageDrafts={setMessageDrafts}
          submittingMessage={submittingMessage}
          messageNotice={messageNotice}
          onSubmitBirthdayMessage={onSubmitBirthdayMessage}
        />

        <MonthBirthdayCalendar
          birthdaysThisMonth={birthdaysThisMonth}
          birthdayCarouselRef={birthdayCarouselRef}
        />
      </div>
    </section>
  )
}
