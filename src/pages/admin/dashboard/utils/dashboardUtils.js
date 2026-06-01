export function moveCarousel(container) {
  if (!container) return

  const card =
    container.querySelector("[data-promo-card]") ||
    container.querySelector("[data-news-card]") ||
    container.querySelector("[data-birthday-message-card]")

  if (!card) return

  const cardWidth = card.getBoundingClientRect().width + 16
  const maxScroll = container.scrollWidth - container.clientWidth

  if (container.scrollLeft + cardWidth >= maxScroll) {
    container.scrollTo({ left: 0, behavior: "smooth" })
  } else {
    container.scrollBy({ left: cardWidth, behavior: "smooth" })
  }
}

export function getInitials(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (parts.length === 0) return "PH"

  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
}

export function daysBetween(fromDate, toDate) {
  const start = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate())
  const end = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate())
  const ms = end.getTime() - start.getTime()

  return Math.floor(ms / (1000 * 60 * 60 * 24))
}

export function getNextBirthday(fechaNacimiento, today) {
  const [, month, day] = String(fechaNacimiento).split("-").map(Number)
  let next = new Date(today.getFullYear(), month - 1, day)

  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate())

  if (next < todayOnly) {
    next = new Date(today.getFullYear() + 1, month - 1, day)
  }

  return next
}

export function formatHumanDate(dateInput) {
  try {
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput)

    return new Intl.DateTimeFormat("es-EC", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date)
  } catch {
    return String(dateInput)
  }
}

export function formatDateISO(date) {
  const safeDate = date instanceof Date ? date : new Date(date)
  const year = safeDate.getFullYear()
  const month = String(safeDate.getMonth() + 1).padStart(2, "0")
  const day = String(safeDate.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

export function formatModoRanking(modo) {
  const m = String(modo || "").trim().toLowerCase()

  if (m === "sin_ranking") return "Sin ranking"
  if (m === "menor_es_mejor") return "Menor tiempo"
  if (m === "mayor_es_mejor") return "Más repeticiones"

  return "Ranking"
}

export function formatModalidad(modalidad) {
  const m = String(modalidad || "").trim().toLowerCase()

  if (m === "single") return "Single"
  if (m === "duo") return "Duo"
  if (m === "trio") return "Trio"

  return "Single"
}
