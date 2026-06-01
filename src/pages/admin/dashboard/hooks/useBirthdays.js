import { useCallback, useEffect, useState } from "react"
import { supabase } from "../../../../supabase"
import {
  daysBetween,
  formatDateISO,
  getNextBirthday,
} from "../utils/dashboardUtils"

export function useBirthdays({ enabled = true } = {}) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [authUser, setAuthUser] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)

  const [birthdaysThisMonth, setBirthdaysThisMonth] = useState([])
  const [todaysBirthdays, setTodaysBirthdays] = useState([])
  const [upcomingBirthdayTargets, setUpcomingBirthdayTargets] = useState([])

  const [birthdayMessages, setBirthdayMessages] = useState([])
  const [messageDrafts, setMessageDrafts] = useState({})
  const [submittingMessage, setSubmittingMessage] = useState("")
  const [messageNotice, setMessageNotice] = useState("")

  const loadBirthdayMessages = useCallback(async ({ targets, users, today }) => {
    try {
      const safeTargets = targets || []

      if (safeTargets.length === 0) {
        setBirthdayMessages([])
        return
      }

      const targetIds = [
        ...new Set(safeTargets.map((item) => item.id).filter(Boolean)),
      ]

      const targetDates = [
        ...new Set(
          safeTargets
            .map((item) => formatDateISO(item.nextBirthday || today))
            .filter(Boolean)
        ),
      ]

      if (targetIds.length === 0 || targetDates.length === 0) {
        setBirthdayMessages([])
        return
      }

      const { data, error } = await supabase
        .from("birthday_messages")
        .select("id,cumpleanero_id,autor_id,mensaje,fecha_cumpleanos,created_at")
        .in("cumpleanero_id", targetIds)
        .in("fecha_cumpleanos", targetDates)
        .order("created_at", { ascending: true })

      if (error) throw error

      const userNameMap = new Map((users || []).map((user) => [user.id, user.nombre]))

      const mapped = (data || []).map((item) => ({
        ...item,
        autor_nombre: userNameMap.get(item.autor_id) || "Compañero PHO3NIX",
      }))

      setBirthdayMessages(mapped)
    } catch (e) {
      console.warn("No se pudieron cargar mensajes de cumpleaños:", e)
      setBirthdayMessages([])
    }
  }, [])

  const refreshBirthdays = useCallback(async () => {
    if (!enabled) return

    try {
      setLoading(true)
      setError("")

      const { data: authData, error: authError } = await supabase.auth.getUser()
      if (authError) throw authError

      const auth = authData?.user || null
      setAuthUser(auth)

      const { data: users, error: usersError } = await supabase
        .from("usuarios")
        .select("id,nombre,email,role,fecha_nacimiento,foto_url")

      if (usersError) throw usersError

      const safeUsers = users ?? []
      const loggedUser = safeUsers.find((user) => user.id === auth?.id) || null

      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const currentMonth = today.getMonth()

      const birthdayRows = safeUsers
        .filter((user) => !!user.fecha_nacimiento)
        .map((user) => {
          const nextBirthday = getNextBirthday(user.fecha_nacimiento, today)
          const [, month, day] = String(user.fecha_nacimiento)
            .split("-")
            .map(Number)

          return {
            id: user.id,
            nombre: user.nombre,
            foto_url: user.foto_url,
            email: user.email,
            role: user.role,
            fechaNacimiento: user.fecha_nacimiento,
            nextBirthday,
            birthMonth: month - 1,
            birthDay: day,
            daysUntil: daysBetween(today, nextBirthday),
          }
        })

      const monthBirthdays = birthdayRows
        .filter((item) => item.birthMonth === currentMonth)
        .sort((a, b) => a.birthDay - b.birthDay || a.nombre.localeCompare(b.nombre))

      const todayBirthdays = birthdayRows
        .filter((item) => item.daysUntil === 0)
        .sort((a, b) => a.nombre.localeCompare(b.nombre))

      const upcomingTargets = birthdayRows
        .filter(
          (item) =>
            item.daysUntil >= 1 &&
            item.daysUntil <= 5 &&
            item.id !== auth?.id
        )
        .sort((a, b) => a.daysUntil - b.daysUntil || a.nombre.localeCompare(b.nombre))

      setCurrentUser(loggedUser)
      setBirthdaysThisMonth(monthBirthdays)
      setTodaysBirthdays(todayBirthdays)
      setUpcomingBirthdayTargets(upcomingTargets)

      await loadBirthdayMessages({
        targets: [...todayBirthdays, ...upcomingTargets],
        users: safeUsers,
        today,
      })
    } catch (e) {
      console.error("Error cargando cumpleaños:", e)
      setError(e?.message || "No se pudo cargar cumpleaños")
    } finally {
      setLoading(false)
    }
  }, [enabled, loadBirthdayMessages])

  useEffect(() => {
    refreshBirthdays()
  }, [refreshBirthdays])

  const handleSubmitBirthdayMessage = useCallback(
    async (target) => {
      try {
        const rawMessage = messageDrafts[target.id] || ""
        const message = rawMessage.trim()

        setMessageNotice("")

        if (!currentUser?.id) {
          setMessageNotice("No se pudo identificar tu usuario para guardar el mensaje.")
          return
        }

        if (currentUser.id === target.id) {
          setMessageNotice("El mensaje debe venir de otro compañero.")
          return
        }

        if (!message) {
          setMessageNotice("Escribe un mensaje antes de guardar.")
          return
        }

        if (message.length > 150) {
          setMessageNotice("El mensaje no puede superar 150 caracteres.")
          return
        }

        setSubmittingMessage(target.id)

        const fechaCumpleanos = formatDateISO(target.nextBirthday)

        const { data, error } = await supabase
          .from("birthday_messages")
          .upsert(
            {
              cumpleanero_id: target.id,
              autor_id: currentUser.id,
              mensaje: message,
              fecha_cumpleanos: fechaCumpleanos,
            },
            {
              onConflict: "cumpleanero_id,autor_id,fecha_cumpleanos",
            }
          )
          .select("id,cumpleanero_id,autor_id,mensaje,fecha_cumpleanos,created_at")
          .single()

        if (error) throw error

        const savedMessage = {
          ...data,
          autor_nombre: currentUser.nombre || "Compañero PHO3NIX",
        }

        setBirthdayMessages((prev) => {
          const filtered = prev.filter(
            (item) =>
              !(
                item.cumpleanero_id === savedMessage.cumpleanero_id &&
                item.autor_id === savedMessage.autor_id &&
                item.fecha_cumpleanos === savedMessage.fecha_cumpleanos
              )
          )

          return [...filtered, savedMessage].sort(
            (a, b) => new Date(a.created_at) - new Date(b.created_at)
          )
        })

        setMessageDrafts((prev) => ({
          ...prev,
          [target.id]: "",
        }))

        setMessageNotice("Mensaje guardado. El cumpleañero lo verá en su día.")
      } catch (e) {
        setMessageNotice(e?.message || "No se pudo guardar el mensaje.")
      } finally {
        setSubmittingMessage("")
      }
    },
    [currentUser, messageDrafts]
  )

  return {
    loading,
    error,
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
    setMessageNotice,

    refreshBirthdays,
    handleSubmitBirthdayMessage,
  }
}
