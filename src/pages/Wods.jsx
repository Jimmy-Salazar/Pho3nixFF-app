//scr/pages/wods.jsx

import { useEffect, useMemo, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { supabase } from "../supabase"

const DAY_LABELS = {
  1: "Lunes",
  2: "Martes",
  3: "Miércoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sábado",
}

export default function Wods() {
  const location = useLocation()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [weekWods, setWeekWods] = useState([])
  const [openBox, setOpenBox] = useState(null)

  const [currentUserId, setCurrentUserId] = useState(null)
  const [currentUserRole, setCurrentUserRole] = useState("")
  const [currentUserName, setCurrentUserName] = useState("")
  const [alumnos, setAlumnos] = useState([])

  const [resultModalOpen, setResultModalOpen] = useState(false)
  const [selectedWod, setSelectedWod] = useState(null)
  const [selectedAlumno1, setSelectedAlumno1] = useState("")
  const [selectedAlumno2, setSelectedAlumno2] = useState("")
  const [selectedAlumno3, setSelectedAlumno3] = useState("")
  const [resultadoInput, setResultadoInput] = useState("")
  const [observacionInput, setObservacionInput] = useState("")
  const [savingResult, setSavingResult] = useState(false)
  const [resultError, setResultError] = useState("")
  const [autoOpenHandled, setAutoOpenHandled] = useState(false)

  const isAdmin = normalizeRole(currentUserRole) === "admin"

  useEffect(() => {
    let alive = true

    async function loadBootstrap() {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser()

        if (authError) throw authError

        const userId = user?.id || null
        if (!userId) return

        const { data: currentUserRow, error: currentUserError } = await supabase
          .from("usuarios")
          .select("id,nombre,role")
          .eq("id", userId)
          .single()

        if (currentUserError) throw currentUserError

        const { data: alumnosRows, error: alumnosError } = await supabase
          .from("usuarios")
          .select("id,nombre,role")
          .eq("role", "Alumno")
          .order("nombre", { ascending: true })

        if (alumnosError) throw alumnosError

        if (!alive) return

        setCurrentUserId(userId)
        setCurrentUserRole(currentUserRow?.role || "")
        setCurrentUserName(currentUserRow?.nombre || "Usuario")
        setAlumnos(alumnosRows || [])
      } catch (e) {
        if (!alive) return
        console.error("Bootstrap WOD error:", e)
      }
    }

    loadBootstrap()

    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    loadWods()
  }, [])

  useEffect(() => {
    const shouldOpenTodayModal = location.state?.openTodayWodModal

    if (!shouldOpenTodayModal) return
    if (autoOpenHandled) return
    if (loading) return

    const todayIso = formatDateISO(new Date())
    const todayWod = weekWods.find(
      (wod) => wod.fecha === todayIso && canShowRanking(wod) && canRegisterToday(wod)
    )

    if (todayWod) {
      openResultModal(todayWod)
    }

    setAutoOpenHandled(true)
    navigate(location.pathname, { replace: true, state: {} })
  }, [location, navigate, loading, weekWods, autoOpenHandled])

  async function loadWods() {
    try {
      setLoading(true)
      setError("")

      const now = new Date()
      const { monday, friday, saturday } = getCurrentWeekRange(now)

      const mondayIso = formatDateISO(monday)
      const fridayIso = formatDateISO(friday)
      const saturdayIso = formatDateISO(saturday)

      const { data: wodRows, error: wodError } = await supabase
        .from("wod")
        .select(`
          id,
          nombre,
          fecha,
          descripcion,
          modo_ranking,
          modalidad,
          activo,
          publicado,
          fecha_publicacion,
          wod_resultados (
            id,
            usuario_id,
            resultado,
            observacion,
            created_at
          )
        `)
        .eq("activo", true)
        .gte("fecha", mondayIso)
        .lte("fecha", fridayIso)
        .order("fecha", { ascending: true })

      if (wodError) throw wodError

      const visibleWods = (wodRows || []).filter((item) => {
        if (!item.fecha) return false
        if (item.publicado === true && item.fecha_publicacion) {
          return new Date(item.fecha_publicacion) <= now
        }
        return true
      })

      const resultIds = Array.from(
        new Set(
          visibleWods
            .flatMap((wod) => wod.wod_resultados || [])
            .map((r) => r.id)
            .filter(Boolean)
        )
      )

      let participantsMap = new Map()

      if (resultIds.length > 0) {
        const { data: participantsRows, error: participantsError } = await supabase
          .from("wod_resultado_participantes")
          .select(`
            wod_resultado_id,
            usuario_id,
            usuarios (
              id,
              nombre
            )
          `)
          .in("wod_resultado_id", resultIds)

        if (participantsError) throw participantsError

        for (const row of participantsRows || []) {
          const key = row.wod_resultado_id
          const list = participantsMap.get(key) || []
          list.push({
            usuario_id: row.usuario_id,
            nombre: row.usuarios?.nombre || "Alumno",
          })
          participantsMap.set(key, list)
        }
      }

      const normalizedWods = visibleWods
        .filter((item) => {
          const day = getIsoDay(item.fecha)
          return day >= 1 && day <= 5
        })
        .map((item) => {
          const resultados = (item.wod_resultados || []).map((r) => {
            const participants = participantsMap.get(r.id) || []
            const participantIds = participants.map((p) => p.usuario_id)
            const participantLabel =
              participants.length > 0
                ? participants.map((p) => p.nombre).join(" / ")
                : "Alumno"

            return {
              ...r,
              participants,
              participantIds,
              participantLabel,
            }
          })

          return {
            ...item,
            modalidad: item.modalidad || "single",
            dayNumber: getIsoDay(item.fecha),
            dayLabel: getDayLabel(item.fecha),
            ranking: sortResultados(resultados, item.modo_ranking),
          }
        })

      const { data: openBoxRow, error: openBoxError } = await supabase
        .from("open_box")
        .select("*")
        .eq("fecha", saturdayIso)
        .maybeSingle()

      if (openBoxError) throw openBoxError

      const visibleOpenBox =
        openBoxRow &&
        (!openBoxRow.fecha_publicacion || new Date(openBoxRow.fecha_publicacion) <= now)

      setWeekWods(normalizedWods)
      setOpenBox(
        visibleOpenBox
          ? buildSaturdayCard(openBoxRow, saturdayIso)
          : { show: false }
      )
    } catch (e) {
      console.error("loadWods error:", e)
      setError(e?.message || "No se pudo cargar el módulo WOD")
    } finally {
      setLoading(false)
    }
  }

  const cards = useMemo(() => {
    const result = [...weekWods]

    if (openBox?.show) {
      result.push({
        id: `open-box-${openBox.fecha}`,
        isOpenBox: true,
        fecha: openBox.fecha,
        dayNumber: 6,
        dayLabel: "Sábado",
        openBox,
      })
    }

    return result.sort((a, b) => a.dayNumber - b.dayNumber)
  }, [weekWods, openBox])

  function canShowRanking(wod) {
    const modo = String(wod?.modo_ranking || "").trim().toLowerCase()
    return modo === "mayor_es_mejor" || modo === "menor_es_mejor"
  }

  function canRegisterToday(wod) {
    if (!canShowRanking(wod)) return false
    const todayIso = formatDateISO(new Date())
    return wod?.fecha === todayIso
  }

  function getSelectedParticipants() {
    return [selectedAlumno1, selectedAlumno2, selectedAlumno3].filter(Boolean)
  }

  function findExistingResultForParticipants(wod, participantIds) {
    const normalized = [...participantIds].sort().join("|")

    return (wod.ranking || []).find((row) => {
      const rowIds = [...(row.participantIds || [])].sort().join("|")
      return rowIds === normalized
    })
  }

  function openResultModal(wod) {
    if (!canRegisterToday(wod)) return

    setSelectedWod(wod)
    setResultError("")
    setResultadoInput("")
    setObservacionInput("")

    if (isAdmin) {
      setSelectedAlumno1("")
      setSelectedAlumno2("")
      setSelectedAlumno3("")
    } else {
      setSelectedAlumno1(currentUserId || "")
      setSelectedAlumno2("")
      setSelectedAlumno3("")

      const ownExisting = (wod.ranking || []).find((row) =>
        (row.participantIds || []).includes(currentUserId)
      )

      if (ownExisting) {
        const ids = ownExisting.participantIds || []
        setSelectedAlumno1(ids[0] || currentUserId || "")
        setSelectedAlumno2(ids[1] || "")
        setSelectedAlumno3(ids[2] || "")
        setResultadoInput(formatResultadoForInput(ownExisting.resultado, wod.modo_ranking))
        setObservacionInput(ownExisting.observacion || "")
      }
    }

    setResultModalOpen(true)
  }

  function closeResultModal() {
    if (savingResult) return
    setResultModalOpen(false)
    setSelectedWod(null)
    setSelectedAlumno1("")
    setSelectedAlumno2("")
    setSelectedAlumno3("")
    setResultadoInput("")
    setObservacionInput("")
    setResultError("")
  }

  useEffect(() => {
    if (!selectedWod) return
    if (!resultModalOpen) return

    const participants = getSelectedParticipants()
    if (participants.length === 0) {
      setResultadoInput("")
      setObservacionInput("")
      return
    }

    const existing = findExistingResultForParticipants(selectedWod, participants)

    if (existing) {
      setResultadoInput(formatResultadoForInput(existing.resultado, selectedWod.modo_ranking))
      setObservacionInput(existing.observacion || "")
    } else {
      setResultadoInput("")
      setObservacionInput("")
    }
  }, [selectedAlumno1, selectedAlumno2, selectedAlumno3, selectedWod, resultModalOpen])

  async function handleSaveResult(e) {
    e.preventDefault()

    if (!selectedWod) return

    if (!canRegisterToday(selectedWod)) {
      setResultError("Solo puedes registrar resultados durante el día activo del WOD.")
      return
    }

    const modalidad = String(selectedWod.modalidad || "single").toLowerCase()
    const participantes = getSelectedParticipants()

    if (participantes.length === 0) {
      setResultError("Debes seleccionar al menos un alumno.")
      return
    }

    if (modalidad === "single" && participantes.length > 1) {
      setResultError("Single solo permite 1 alumno.")
      return
    }

    if (modalidad === "duo" && participantes.length > 2) {
      setResultError("Duo permite máximo 2 alumnos.")
      return
    }

    if (modalidad === "trio" && participantes.length > 3) {
      setResultError("Trio permite máximo 3 alumnos.")
      return
    }

    if (new Set(participantes).size !== participantes.length) {
      setResultError("No se pueden repetir alumnos dentro del mismo equipo.")
      return
    }

    if (!isAdmin && !participantes.includes(currentUserId)) {
      setResultError("Debes estar incluido en el resultado.")
      return
    }

    const existing = findExistingResultForParticipants(selectedWod, participantes)

    const conflictingParticipant = (selectedWod.ranking || []).find((row) => {
      if (existing?.id && row.id === existing.id) return false
      return (row.participantIds || []).some((id) => participantes.includes(id))
    })

    if (conflictingParticipant) {
      setResultError(
        `Uno de los alumnos ya está registrado en este WOD: ${conflictingParticipant.participantLabel}`
      )
      return
    }

    const numericResultado = parseResultadoInput(resultadoInput, selectedWod.modo_ranking)

    if (numericResultado == null || Number.isNaN(numericResultado) || numericResultado < 0) {
      setResultError(
        selectedWod.modo_ranking === "menor_es_mejor"
          ? "Ingresa un tiempo válido en formato mm:ss. Ejemplo: 5:22"
          : "Ingresa un resultado numérico válido."
      )
      return
    }

    try {
      setSavingResult(true)
      setResultError("")

      if (existing?.id) {
        const { error: updateError } = await supabase
          .from("wod_resultados")
          .update({
            resultado: numericResultado,
            observacion: observacionInput || null,
            usuario_id: participantes[0],
          })
          .eq("id", existing.id)

        if (updateError) throw updateError
      } else {
        const { data: newRow, error: insertError } = await supabase
          .from("wod_resultados")
          .insert({
            wod_id: selectedWod.id,
            usuario_id: participantes[0],
            resultado: numericResultado,
            observacion: observacionInput || null,
          })
          .select("id")
          .single()

        if (insertError) throw insertError

        const orderedParticipants = isAdmin
          ? participantes
          : [
              currentUserId,
              ...participantes.filter((id) => id !== currentUserId),
            ]

        const participantRows = orderedParticipants.map((usuarioId) => ({
          wod_resultado_id: newRow.id,
          usuario_id: usuarioId,
        }))

        const { error: participantsInsertError } = await supabase
          .from("wod_resultado_participantes")
          .insert(participantRows)

        if (participantsInsertError) throw participantsInsertError
      }

      await loadWods()
      closeResultModal()
    } catch (e) {
      console.error("save result error:", e)
      setResultError(e?.message || "No se pudo guardar el resultado.")
    } finally {
      setSavingResult(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-6 text-white md:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 rounded-3xl border border-orange-500/20 bg-white/5 p-5 shadow-2xl backdrop-blur-xl">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-orange-400/20 bg-orange-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-orange-300">
            Weekly Training
          </div>

          <h1 className="text-2xl font-black tracking-tight md:text-4xl">
            WODs de la Semana
          </h1>

          <p className="mt-2 text-sm text-slate-300 md:text-base">
            Consulta los WODs programados, revisa rankings y visualiza el Open Box del sábado.
          </p>
        </div>

        {error ? (
          <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white/60">
            Cargando WODs...
          </div>
        ) : cards.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-6 text-white/60">
            No hay WODs visibles para esta semana.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
            {cards.map((card) =>
              card.isOpenBox ? (
                <OpenBoxCard key={card.id} item={card.openBox} />
              ) : (
                <WodCard
                  key={card.id}
                  item={card}
                  canShowRanking={canShowRanking(card)}
                  canRegisterToday={canRegisterToday(card)}
                  onRegister={() => openResultModal(card)}
                />
              )
            )}
          </div>
        )}

        {resultModalOpen && selectedWod ? (
          <ResultModal
            wod={selectedWod}
            isAdmin={isAdmin}
            currentUserName={currentUserName}
            currentUserId={currentUserId}
            alumnos={alumnos}
            selectedAlumno1={selectedAlumno1}
            setSelectedAlumno1={setSelectedAlumno1}
            selectedAlumno2={selectedAlumno2}
            setSelectedAlumno2={setSelectedAlumno2}
            selectedAlumno3={selectedAlumno3}
            setSelectedAlumno3={setSelectedAlumno3}
            resultadoInput={resultadoInput}
            setResultadoInput={setResultadoInput}
            observacionInput={observacionInput}
            setObservacionInput={setObservacionInput}
            onClose={closeResultModal}
            onSubmit={handleSaveResult}
            saving={savingResult}
            error={resultError}
          />
        ) : null}
      </div>
    </div>
  )
}

function WodCard({ item, canShowRanking, canRegisterToday, onRegister }) {
  const hasRanking = canShowRanking && item.ranking?.length > 0

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl transition hover:bg-white/[0.06]">
      <div className="border-b border-white/10 bg-gradient-to-br from-orange-500/15 via-white/5 to-blue-500/15 p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="inline-flex rounded-full border border-orange-400/20 bg-orange-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-orange-300">
            {item.dayLabel}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded-xl border border-white/10 bg-white/10 px-3 py-1 text-xs text-white/75">
              {formatModoRanking(item.modo_ranking)}
            </div>
            <div className="rounded-xl border border-white/10 bg-white/10 px-3 py-1 text-xs text-white/75">
              {formatModalidad(item.modalidad)}
            </div>
          </div>
        </div>

        <div className="mt-4 text-sm text-white/50">{formatHumanDate(item.fecha)}</div>

        <h3 className="mt-2 text-2xl font-black tracking-tight text-white">
          {item.nombre || "WOD del día"}
        </h3>
      </div>

      <div className="p-5">
        <p className="whitespace-pre-line text-sm leading-6 text-white/75">
          {item.descripcion || "Sin descripción disponible."}
        </p>

        {canShowRanking ? (
          <div className="mt-5">
            {canRegisterToday ? (
              <button
                type="button"
                onClick={onRegister}
                className="rounded-2xl border border-orange-400/20 bg-orange-500/10 px-4 py-2 text-sm font-medium text-orange-200 transition hover:bg-orange-500/15"
              >
                Registrar resultado
              </button>
            ) : (
              <div className="inline-flex rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-white/65">
                Registro cerrado o no disponible hoy
              </div>
            )}
          </div>
        ) : (
          <div className="mt-5 inline-flex rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-white/65">
            WOD informativo
          </div>
        )}

        {hasRanking ? (
          <div className="mt-6">
            <div className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-white/55">
              Ranking
            </div>

            <div className="space-y-3">
              {item.ranking.map((row, index) => (
                <div
                  key={row.id}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-sm font-semibold text-white/80">
                      {index + 1}
                    </div>

                    <div className="min-w-0">
                      <div className="truncate font-medium text-white">
                        {row.participantLabel || "Alumno"}
                      </div>

                      {row.observacion ? (
                        <div className="mt-1 truncate text-xs text-white/45">
                          {row.observacion}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="shrink-0 rounded-xl border border-white/10 bg-white/10 px-3 py-1 text-sm font-semibold text-orange-300">
                    {formatResultado(row.resultado, item.modo_ranking)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : canShowRanking ? (
          <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-white/5 px-4 py-5 text-sm text-white/55">
            Aún no hay registros para este WOD.
          </div>
        ) : null}
      </div>
    </div>
  )
}

function OpenBoxCard({ item }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-orange-500/20 bg-white/5 shadow-2xl backdrop-blur-xl">
      <div className="h-40 w-full bg-gradient-to-br from-orange-500/20 via-white/5 to-red-500/20" />

      <div className="p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="inline-flex rounded-full border border-orange-400/20 bg-orange-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-orange-300">
            Sábado
          </div>

          <div className="rounded-xl border border-white/10 bg-white/10 px-3 py-1 text-xs text-white/75">
            {item.hora_inicio || "08:00"} - {item.hora_fin || "10:00"}
          </div>
        </div>

        <div className="mt-4 text-sm text-white/50">{formatHumanDate(item.fecha)}</div>

        <h3 className="mt-2 text-2xl font-black text-white">
          {item.titulo || "OPEN BOX"}
        </h3>

        <p className="mt-3 text-sm leading-6 text-white/75">
          {item.descripcion || "Open Box de 8:00 a.m. a 10:00 a.m."}
        </p>
      </div>
    </div>
  )
}

function ResultModal({
  wod,
  isAdmin,
  currentUserName,
  currentUserId,
  alumnos,
  selectedAlumno1,
  setSelectedAlumno1,
  selectedAlumno2,
  setSelectedAlumno2,
  selectedAlumno3,
  setSelectedAlumno3,
  resultadoInput,
  setResultadoInput,
  observacionInput,
  setObservacionInput,
  onClose,
  onSubmit,
  saving,
  error,
}) {
  const modalidad = String(wod.modalidad || "single").toLowerCase()

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-[301] w-full max-w-xl overflow-hidden rounded-3xl border border-white/10 bg-[#0b0f14] shadow-2xl">
        <div className="border-b border-white/10 bg-gradient-to-br from-orange-500/10 via-white/5 to-blue-500/10 p-5 sm:p-6">
          <div className="text-xs uppercase tracking-[0.2em] text-orange-300">
            Registrar resultado
          </div>

          <h3 className="mt-2 text-xl font-semibold text-white sm:text-2xl">
            {wod.nombre || "WOD del día"}
          </h3>

          <p className="mt-2 text-sm text-white/60">
            {wod.dayLabel} • {formatModoRanking(wod.modo_ranking)} • {formatModalidad(wod.modalidad)}
          </p>
        </div>

        <form onSubmit={onSubmit} className="p-5 sm:p-6">
          <div className="space-y-4">
            <ParticipantSelect
              label="Alumno 1"
              value={selectedAlumno1}
              onChange={setSelectedAlumno1}
              alumnos={alumnos}
              disabled={!isAdmin}
              fixedLabel={!isAdmin ? currentUserName : null}
              fixedValue={!isAdmin ? currentUserId : null}
            />

            {modalidad !== "single" ? (
              <ParticipantSelect
                label="Alumno 2"
                value={selectedAlumno2}
                onChange={setSelectedAlumno2}
                alumnos={alumnos}
              />
            ) : null}

            {modalidad === "trio" ? (
              <ParticipantSelect
                label="Alumno 3"
                value={selectedAlumno3}
                onChange={setSelectedAlumno3}
                alumnos={alumnos}
              />
            ) : null}

            <div>
              <label className="mb-2 block text-sm font-medium text-white/80">
                Resultado ({formatModoRanking(wod.modo_ranking)})
              </label>

              <input
                type={wod.modo_ranking === "menor_es_mejor" ? "text" : "number"}
                step={wod.modo_ranking === "menor_es_mejor" ? undefined : "any"}
                value={resultadoInput}
                onChange={(e) => setResultadoInput(e.target.value)}
                placeholder={
                  wod.modo_ranking === "menor_es_mejor"
                    ? "Ejemplo: 5:22"
                    : "Ejemplo: 145"
                }
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-orange-400/30"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white/80">
                Observación
              </label>

              <textarea
                value={observacionInput}
                onChange={(e) => setObservacionInput(e.target.value)}
                rows={3}
                className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-orange-400/30"
              />
            </div>

            {error ? (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            ) : null}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-2xl border border-orange-400/20 bg-orange-500/10 px-4 py-2 text-sm font-medium text-orange-200 transition hover:bg-orange-500/15 disabled:opacity-60"
            >
              {saving ? "Guardando..." : "Guardar resultado"}
            </button>

            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-white/85 transition hover:bg-white/15 disabled:opacity-60"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ParticipantSelect({
  label,
  value,
  onChange,
  alumnos,
  disabled = false,
  fixedLabel = null,
  fixedValue = null,
}) {
  if (disabled && fixedLabel) {
    return (
      <div>
        <label className="mb-2 block text-sm font-medium text-white/80">
          {label}
        </label>
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white/85">
          {fixedLabel}
        </div>
      </div>
    )
  }

  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-white/80">
        {label}
      </label>

      <select
        value={disabled ? fixedValue || value : value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-500"
      >
        <option value="">NADIE</option>
        {alumnos.map((alumno) => (
          <option key={alumno.id} value={alumno.id}>
            {alumno.nombre}
          </option>
        ))}
      </select>
    </div>
  )
}

function buildSaturdayCard(openBoxRow, saturdayIso) {
  if (!openBoxRow) {
    return {
      show: true,
      fecha: saturdayIso,
      titulo: "OPEN BOX",
      descripcion: "Open Box de 8:00 a.m. a 10:00 a.m.",
      hora_inicio: "08:00",
      hora_fin: "10:00",
    }
  }

  if (openBoxRow.activo === false) return { show: false }
  return { show: true, ...openBoxRow }
}

function sortResultados(rows, modoRanking) {
  const safe = [...rows]

  if (String(modoRanking || "").toLowerCase() === "menor_es_mejor") {
    safe.sort((a, b) => Number(a.resultado) - Number(b.resultado))
    return safe
  }

  safe.sort((a, b) => Number(b.resultado) - Number(a.resultado))
  return safe
}

function getCurrentWeekRange(date) {
  const current = new Date(date)
  const jsDay = current.getDay()
  const isoDay = jsDay === 0 ? 7 : jsDay

  const monday = new Date(current)
  monday.setHours(0, 0, 0, 0)
  monday.setDate(current.getDate() - (isoDay - 1))

  const friday = new Date(monday)
  friday.setDate(monday.getDate() + 4)
  friday.setHours(23, 59, 59, 999)

  const saturday = new Date(monday)
  saturday.setDate(monday.getDate() + 5)
  saturday.setHours(0, 0, 0, 0)

  return { monday, friday, saturday }
}

function getIsoDay(dateInput) {
  const d = new Date(`${dateInput}T00:00:00`)
  const day = d.getDay()
  return day === 0 ? 7 : day
}

function getDayLabel(dateInput) {
  return DAY_LABELS[getIsoDay(dateInput)] || "Día"
}

function formatDateISO(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function formatHumanDate(dateInput) {
  try {
    const date =
      dateInput instanceof Date ? dateInput : new Date(`${dateInput}T00:00:00`)

    return new Intl.DateTimeFormat("es-EC", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(date)
  } catch {
    return String(dateInput)
  }
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

function formatResultado(resultado, modoRanking) {
  const n = Number(resultado)

  if (Number.isNaN(n)) return "-"

  if (String(modoRanking || "").toLowerCase() === "menor_es_mejor") {
    const mins = Math.floor(n / 60)
    const secs = Math.round(n % 60)
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
  }

  return `${n}`
}

function parseResultadoInput(value, modoRanking) {
  const raw = String(value || "").trim()

  if (!raw) return null

  if (String(modoRanking || "").toLowerCase() === "menor_es_mejor") {
    const match = raw.match(/^(\d{1,2}):([0-5]\d)$/)
    if (!match) return null

    const mins = Number(match[1])
    const secs = Number(match[2])

    return mins * 60 + secs
  }

  const numeric = Number(raw)
  return Number.isNaN(numeric) ? null : numeric
}

function formatResultadoForInput(resultado, modoRanking) {
  const n = Number(resultado)

  if (Number.isNaN(n)) return ""

  if (String(modoRanking || "").toLowerCase() === "menor_es_mejor") {
    const mins = Math.floor(n / 60)
    const secs = Math.round(n % 60)
    return `${mins}:${String(secs).padStart(2, "0")}`
  }

  return String(n)
}

function normalizeRole(role) {
  const r = String(role || "").trim().toLowerCase()
  if (r === "admin" || r === "administrador") return "admin"
  if (r === "alumno" || r === "student") return "alumno"
  return r
}