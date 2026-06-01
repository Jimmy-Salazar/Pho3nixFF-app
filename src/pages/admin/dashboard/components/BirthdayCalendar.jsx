// src/pages/admin/dashboard/components/BirthdayCalendar.jsx

import { useMemo, useState } from "react"

const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
]

const WEEK_DAYS = ["L", "M", "M", "J", "V", "S", "D"]

export default function BirthdayCalendar({ birthdayRows = [], onMonthChange }) {
  const today = new Date()

  const [visibleDate, setVisibleDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  )

  const visibleYear = visibleDate.getFullYear()
  const visibleMonth = visibleDate.getMonth()

  const normalizedBirthdays = useMemo(() => {
    return (birthdayRows || [])
      .map(normalizeBirthdayRow)
      .filter((item) => item.birthMonth !== null && item.birthDay !== null)
  }, [birthdayRows])

  const monthBirthdays = useMemo(() => {
    return normalizedBirthdays
      .filter((item) => Number(item.birthMonth) === Number(visibleMonth))
      .sort((a, b) => Number(a.birthDay) - Number(b.birthDay))
  }, [normalizedBirthdays, visibleMonth])

  const birthdaysByDay = useMemo(() => {
    const map = new Map()

    monthBirthdays.forEach((item) => {
      const day = Number(item.birthDay)

      if (!map.has(day)) {
        map.set(day, [])
      }

      map.get(day).push(item)
    })

    return map
  }, [monthBirthdays])

  const calendarDays = useMemo(() => {
    const firstDay = new Date(visibleYear, visibleMonth, 1)
    const lastDay = new Date(visibleYear, visibleMonth + 1, 0)
    const totalDays = lastDay.getDate()
    const firstWeekday = normalizeMondayFirst(firstDay.getDay())
    const slots = []

    for (let i = 0; i < firstWeekday; i += 1) {
      slots.push(null)
    }

    for (let day = 1; day <= totalDays; day += 1) {
      slots.push(day)
    }

    while (slots.length % 7 !== 0) {
      slots.push(null)
    }

    return slots
  }, [visibleYear, visibleMonth])

  function emitMonthChange(date) {
    if (typeof onMonthChange !== "function") return

    const month = date.getMonth()

    onMonthChange({
      month,
      year: date.getFullYear(),
      birthdays: normalizedBirthdays.filter(
        (item) => Number(item.birthMonth) === Number(month)
      ),
    })
  }

  function changeMonth(offset) {
    const next = new Date(visibleYear, visibleMonth + offset, 1)
    setVisibleDate(next)
    emitMonthChange(next)
  }

  function goToday() {
    const current = new Date(today.getFullYear(), today.getMonth(), 1)
    setVisibleDate(current)
    emitMonthChange(current)
  }

  const isCurrentMonth =
    visibleYear === today.getFullYear() && visibleMonth === today.getMonth()

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-1 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => changeMonth(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-black/25 text-white/70 transition hover:border-orange-400/40 hover:text-orange-300"
          aria-label="Mes anterior"
        >
          ‹
        </button>

        <div className="text-center">
          <div className="mt-0.5 text-base font-black text-white">
            {MONTHS[visibleMonth]} {visibleYear}
          </div>
        </div>

        <button
          type="button"
          onClick={() => changeMonth(1)}
          className="flex h-9 w-9 items-center justify-center rounded-x2 border border-white/10 bg-black/25 text-white/70 transition hover:border-orange-400/40 hover:text-orange-300"
          aria-label="Mes siguiente"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-7 h-8 text-center text-[15px] font-black uppercase text-white/70">
        {WEEK_DAYS.map((day, index) => (
          <div key={`${day}-${index}`} className="py-1">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-[20px]">
        {calendarDays.map((day, index) => {
          const birthdays = day ? birthdaysByDay.get(day) || [] : []
          const hasBirthday = birthdays.length > 0
          const isToday = isCurrentMonth && day === today.getDate()

          return (
            <div
              key={`${day || "empty"}-${index}`}
              className={[
                "relative flex h-flex items-center justify-center rounded-x2 border text-xs font-black transition",
                day
                  ? "border-white/10 bg-black/20 text-white/70"
                  : "border-transparent bg-transparent text-transparent",
                isToday ? "border-orange-400/50 text-orange-300" : "",
                hasBirthday
                  ? "border-orange-500/35 bg-orange-500/15 text-orange-200 shadow-[0_0_14px_rgba(249,115,22,0.18)]"
                  : "",
              ].join(" ")}
              title={
                hasBirthday
                  ? birthdays.map((item) => item.nombre).join(", ")
                  : undefined
              }
            >
              {day || ""}

              {hasBirthday ? (
                <span className="absolute bottom-1 h-1.5 w-1.5 rounded-full bg-orange-400 shadow-[0_0_8px_rgba(249,115,22,0.9)]" />
              ) : null}
            </div>
          )
        })}
      </div>

    </div>
  )
}

function normalizeBirthdayRow(item) {
  const rawDate =
    item.fecha_nacimiento ||
    item.fechaNacimiento ||
    item.birthDate ||
    item.birthday ||
    item.nacimiento ||
    null

  let birthMonth = null
  let birthDay = null

  // Si hay fecha real, esa manda.
  if (rawDate) {
    const dateParts = parseBirthDate(rawDate)

    if (dateParts) {
      birthMonth = dateParts.month
      birthDay = dateParts.day
    }
  } else {
    // Solo si NO hay fecha real, usamos birthMonth/birthDay ya calculados.
    birthMonth =
      item.birthMonth !== undefined && item.birthMonth !== null
        ? Number(item.birthMonth)
        : null

    birthDay =
      item.birthDay !== undefined && item.birthDay !== null
        ? Number(item.birthDay)
        : null
  }

  return {
    ...item,
    nombre:
      item.nombre ||
      item.name ||
      item.full_name ||
      item.fullName ||
      item.email ||
      "Cumpleañero",
    birthMonth,
    birthDay,
  }
}

function parseBirthDate(value) {
  if (!value) return null

  const text = String(value).trim()

  // Formato esperado desde Supabase date: YYYY-MM-DD
  const isoMatch = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (isoMatch) {
    return {
      month: normalizeMonth(Number(isoMatch[2])),
      day: normalizeDay(Number(isoMatch[3])),
    }
  }

  // Formato alterno: DD/MM/YYYY o DD-MM-YYYY
  const latinMatch = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/)
  if (latinMatch) {
    return {
      month: normalizeMonth(Number(latinMatch[2])),
      day: normalizeDay(Number(latinMatch[1])),
    }
  }

  const parsed = new Date(text)

  if (Number.isNaN(parsed.getTime())) {
    return null
  }

  return {
    month: parsed.getMonth(),
    day: parsed.getDate(),
  }
}

function normalizeMonth(value) {
  if (value === null || value === undefined || value === "") return null

  const month = Number(value)

  if (!Number.isFinite(month)) return null

  // Soporta meses 1-12 desde BD. Enero=1 -> 0.
  if (month >= 1 && month <= 12) return month - 1

  // Soporta meses 0-11 si ya venían normalizados.
  if (month >= 0 && month <= 11) return month

  return null
}

function normalizeDay(value) {
  if (value === null || value === undefined || value === "") return null

  const day = Number(value)

  if (!Number.isFinite(day)) return null

  if (day >= 1 && day <= 31) return day

  return null
}

function normalizeMondayFirst(day) {
  return day === 0 ? 6 : day - 1
}
