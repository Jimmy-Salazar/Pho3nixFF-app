import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../../supabase"
import { mensualidadStatusInfo } from "../../utils/mensualidades"
import BirthdaySection from "./dashboard/components/BirthdaySection"
import TrainingAndPromosSection from "./dashboard/components/TrainingAndPromosSection"
import QuickAccessSection from "./dashboard/components/QuickAccessSection"
import AlumnoDashboardHeader from "./dashboard/components/AlumnoDashboardHeader"
import { useAutoCarousel } from "./dashboard/hooks/useAutoCarousel"
import { useBirthdays } from "./dashboard/hooks/useBirthdays"

export default function AlumnoDashboard() {
  const navigate = useNavigate()
  const promoRef = useRef(null)
  const birthdayCarouselRef = useRef(null)

  const {
    loading: birthdaysLoading,
    error: birthdaysError,
    authUser,
    currentUser,
    birthdaysThisMonth,
    todaysBirthdays,
    upcomingBirthdayTargets,
    birthdayMessages,
    messageDrafts,
    setMessageDrafts,
    submittingMessage,
    messageNotice,
    handleSubmitBirthdayMessage,
  } = useBirthdays()

  const [todayWod, setTodayWod] = useState(null)
  const [todayWodLoading, setTodayWodLoading] = useState(true)

  const [alumnoExpiringRows, setAlumnoExpiringRows] = useState([])
  const [alumnoExpiringLabel, setAlumnoExpiringLabel] = useState("Tu mensualidad está activa")

  const [eventosBox, setEventosBox] = useState([])
  const [publicidades, setPublicidades] = useState([])

  useEffect(() => {
    let alive = true

    const loadTodayWod = async () => {
      try {
        setTodayWodLoading(true)

        const now = new Date()
        const todayIso = formatDateISO(now)

        const { data, error } = await supabase
          .from("wod")
          .select("id,nombre,descripcion,modo_ranking,modalidad,fecha,activo,publicado,fecha_publicacion")
          .eq("fecha", todayIso)
          .eq("activo", true)
          .limit(5)

        if (error) throw error

        const safeRows = (data || []).filter((item) => {
          if (item.publicado === true && item.fecha_publicacion) {
            return new Date(item.fecha_publicacion) <= now
          }
          return true
        })

        if (alive) setTodayWod(safeRows[0] || null)
      } catch (e) {
        console.error("Error cargando WOD del día:", e)
        if (alive) setTodayWod(null)
      } finally {
        if (alive) setTodayWodLoading(false)
      }
    }

    const loadLocalContent = async () => {
      try {
        const todayIso = formatDateISO(new Date())

        const { data: eventos } = await supabase
          .from("dashboard_eventos")
          .select("id,titulo,descripcion,fecha,imagen_url,activo")
          .eq("activo", true)
          .gte("fecha", todayIso)
          .order("fecha", { ascending: true })
          .limit(8)

        if (alive) setEventosBox(eventos ?? [])
      } catch {
        if (alive) setEventosBox([])
      }

      try {
        const { data: ads } = await supabase
          .from("dashboard_publicidad")
          .select("id,titulo,descripcion,imagen_url,url,activo,orden")
          .eq("activo", true)
          .order("orden", { ascending: true })
          .limit(10)

        if (alive) setPublicidades(ads ?? [])
      } catch {
        if (alive) setPublicidades([])
      }
    }

    loadTodayWod()
    loadLocalContent()

    return () => {
      alive = false
    }
  }, [])

  async function loadAlumnoMensualidad(userId, now, alive) {
    try {
      const { data: mensualidades, error } = await supabase
        .from("mensualidades")
        .select("id,usuario_id,fecha_inicio,fecha_fin,estado,created_at")
        .eq("usuario_id", userId)
        .order("fecha_fin", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(1)

      if (error) throw error

      const latest = mensualidades?.[0]
      if (!latest) return

      const info = mensualidadStatusInfo(latest, now)

      if (info.active && info.daysLeft !== null && info.daysLeft >= 0 && info.daysLeft <= 7) {
        const row = {
          id: latest.id,
          fechaFin: latest.fecha_fin,
          diffDays: info.daysLeft,
        }

        if (!alive) return

        setAlumnoExpiringRows([row])
        setAlumnoExpiringLabel(
          info.daysLeft === 0
            ? "Tu mensualidad vence hoy"
            : `Tu mensualidad vence en ${info.daysLeft} día(s)`
        )
      }
    } catch {
      if (!alive) return
      setAlumnoExpiringRows([])
    }
  }

  useEffect(() => {
    let alive = true

    if (authUser?.id) {
      loadAlumnoMensualidad(authUser.id, new Date(), alive)
    }

    return () => {
      alive = false
    }
  }, [authUser?.id])

  const heroBirthday = todaysBirthdays[0] || null
  const nextEvent = eventosBox[0] || null

  const visualItems = useMemo(
    () => [
      ...eventosBox.map((item) => ({ ...item, tipoVisual: "Evento" })),
      ...publicidades.map((item) => ({ ...item, tipoVisual: "Publicidad" })),
    ],
    [eventosBox, publicidades]
  )

  useAutoCarousel(promoRef, [eventosBox, publicidades], {
    enabled: eventosBox.length + publicidades.length > 1,
    intervalMs: 4200,
  })

  useAutoCarousel(birthdayCarouselRef, [birthdaysThisMonth], {
    enabled: birthdaysThisMonth.length > 1,
    intervalMs: 4000,
  })

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-6 text-white md:px-6">
      <div className="mx-auto max-w-[1480px]">
        <AlumnoDashboardHeader currentUser={currentUser} />

        {birthdaysError ? (
          <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {birthdaysError}
          </div>
        ) : null}

        <BirthdaySection
          currentUser={currentUser}
          heroBirthday={heroBirthday}
          birthdaysThisMonth={birthdaysThisMonth}
          todaysBirthdays={todaysBirthdays}
          upcomingBirthdayTargets={upcomingBirthdayTargets}
          birthdayMessages={birthdayMessages}
          messageDrafts={messageDrafts}
          setMessageDrafts={setMessageDrafts}
          submittingMessage={submittingMessage}
          messageNotice={messageNotice}
          onSubmitBirthdayMessage={handleSubmitBirthdayMessage}
          alumnoExpiringRows={alumnoExpiringRows}
          alumnoExpiringLabel={alumnoExpiringLabel}
          birthdayCarouselRef={birthdayCarouselRef}
        />

        <TrainingAndPromosSection
          todayWod={todayWod}
          todayWodLoading={todayWodLoading}
          visualItems={visualItems}
          promoRef={promoRef}
          navigate={navigate}
        />
        <QuickAccessSection navigate={navigate} />
      </div>
    </div>
  )
}

function moveCarousel(container) {
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

function getInitials(name) {
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

function daysBetween(fromDate, toDate) {
  const start = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate())
  const end = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate())
  const ms = end.getTime() - start.getTime()
  return Math.floor(ms / (1000 * 60 * 60 * 24))
}

function getNextBirthday(fechaNacimiento, today) {
  const [, month, day] = String(fechaNacimiento).split("-").map(Number)
  let next = new Date(today.getFullYear(), month - 1, day)

  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  if (next < todayOnly) {
    next = new Date(today.getFullYear() + 1, month - 1, day)
  }

  return next
}

function formatHumanDate(dateInput) {
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

function formatDateISO(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function formatModoRanking(modo) {
  const m = String(modo || "").trim().toLowerCase()

  if (m === "sin_ranking") return "Sin ranking"
  if (m === "menor_es_mejor") return "Menor tiempo"
  if (m === "mayor_es_mejor") return "Más repeticiones"

  return "Ranking"
}

function formatModalidad(modalidad) {
  const m = String(modalidad || "").trim().toLowerCase()

  if (m === "single") return "Single"
  if (m === "duo") return "Duo"
  if (m === "trio") return "Trio"

  return "Single"
}
