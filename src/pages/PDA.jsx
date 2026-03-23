import { useEffect, useMemo, useState } from "react"
import { supabase } from "../supabase"

function getNow() {
  return new Date()
}

function getTodayLocalDate() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, "0")
  const d = String(now.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

function formatDate(dateStr) {
  if (!dateStr) return "Sin fecha"
  const [y, m, d] = dateStr.split("-")
  return `${d}/${m}/${y}`
}

function formatDay(dateStr) {
  if (!dateStr) return "--"
  const [, , d] = dateStr.split("-")
  return d
}

function formatRankingLabel(modo) {
  if (modo === "mayor_es_mejor") return "Mayor es mejor"
  if (modo === "menor_es_mejor") return "Menor es mejor"
  if (modo === "sin_ranking") return "Sin ranking"
  return modo || "-"
}

function getPreviewStart(fechaPda) {
  const start = new Date(`${fechaPda}T00:00:00`)
  return new Date(start.getTime() - 5 * 60 * 60 * 1000)
}

function getStudentSeasonCardStart(year) {
  return new Date(`${year}-11-26T00:00:00`)
}

function getStudentCalendarStart(year) {
  return new Date(`${year}-11-30T19:00:00`)
}

function sortRanking(rows, modo) {
  const safe = [...rows]

  if (modo === "mayor_es_mejor") {
    safe.sort((a, b) => Number(b.resultado_valor || 0) - Number(a.resultado_valor || 0))
  } else if (modo === "menor_es_mejor") {
    safe.sort((a, b) => Number(a.resultado_valor || 0) - Number(b.resultado_valor || 0))
  }

  return safe
}

export default function PDA() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [user, setUser] = useState(null)
  const [rol, setRol] = useState(null)

  const [pdaList, setPdaList] = useState([])
  const [ranking, setRanking] = useState([])
  const [usuarios, setUsuarios] = useState([])

  const [showRanking, setShowRanking] = useState(false)
  const [showRegistro, setShowRegistro] = useState(false)
  const [selectedPdaForRanking, setSelectedPdaForRanking] = useState(null)

  const [form, setForm] = useState({
    usuario_id: "",
    resultado_valor: "",
    resultado_texto: "",
    observaciones: "",
  })

  const now = getNow()
  const hoy = getTodayLocalDate()
  const currentYear = new Date().getFullYear()

  const seasonCardStart = getStudentSeasonCardStart(currentYear)
  const calendarStart = getStudentCalendarStart(currentYear)

  const isAdmin =
    String(rol || "").toLowerCase() === "admin" ||
    String(rol || "").toLowerCase() === "administrador"

  async function cargarSesionYRol() {
    const { data: authData } = await supabase.auth.getUser()
    const authUser = authData?.user || null
    setUser(authUser)

    if (!authUser) {
      setRol(null)
      return null
    }

    const { data: perfil } = await supabase
      .from("perfiles")
      .select("rol")
      .eq("id", authUser.id)
      .maybeSingle()

    setRol(perfil?.rol || "alumno")
    return authUser
  }

  async function cargarUsuarios() {
    const { data, error } = await supabase
      .from("usuarios")
      .select("id, nombre, activo")
      .eq("activo", true)
      .order("nombre", { ascending: true })

    if (error) throw error
    setUsuarios(data || [])
  }

  async function cargarPdas(adminMode) {
    try {
      await supabase.rpc("sync_pda_estados")
    } catch (e) {
      console.warn("No se pudo sincronizar PDA automáticamente:", e)
    }

    const start = `${currentYear}-12-01`
    const end = `${currentYear}-12-31`

    let query = supabase
      .from("pda")
      .select("*")
      .gte("fecha_pda", start)
      .lte("fecha_pda", end)
      .order("fecha_pda", { ascending: true })

    if (!adminMode) {
      query = query.not("fecha_publicacion", "is", null)
    }

    const { data, error } = await query
    if (error) throw error

    setPdaList(data || [])
    return data || []
  }

  async function cargarRanking(pdaId) {
    if (!pdaId) {
      setRanking([])
      return []
    }

    const { data, error } = await supabase
      .from("pda_resultados")
      .select(`
        id,
        pda_id,
        usuario_id,
        resultado_valor,
        resultado_texto,
        observaciones,
        created_at,
        usuarios (
          id,
          nombre
        )
      `)
      .eq("pda_id", pdaId)

    if (error) throw error
    setRanking(data || [])
    return data || []
  }

  async function openRankingModal(pda) {
    try {
      setSelectedPdaForRanking(pda)
      await cargarRanking(pda.id)
      setShowRanking(true)
    } catch (err) {
      console.error("Error cargando ranking:", err)
      alert(err.message || "No se pudo cargar el ranking")
    }
  }

  async function cargarTodo() {
    try {
      setLoading(true)

      const authUser = await cargarSesionYRol()
      await cargarUsuarios()

      const { data: perfil } = authUser
        ? await supabase.from("perfiles").select("rol").eq("id", authUser.id).maybeSingle()
        : { data: null }

      const adminMode =
        String(perfil?.rol || "").toLowerCase() === "admin" ||
        String(perfil?.rol || "").toLowerCase() === "administrador"

      if (authUser?.id) {
        setForm((prev) => ({
          ...prev,
          usuario_id: authUser.id,
        }))
      }

      await cargarPdas(adminMode)
    } catch (err) {
      console.error("Error cargando PDA:", err)
      alert(err.message || "Error cargando PDA")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarTodo()
  }, [])

  const alumnoPuedeVerPagina = useMemo(() => {
    if (isAdmin) return true
    return now >= seasonCardStart
  }, [isAdmin, now, seasonCardStart])

  const alumnoPuedeVerCalendario = useMemo(() => {
    if (isAdmin) return true
    return now >= calendarStart
  }, [isAdmin, now, calendarStart])

  const pdaVisiblesEnCalendario = useMemo(() => {
    if (isAdmin) return pdaList

    if (!alumnoPuedeVerCalendario) return []

    return pdaList.filter((item) => {
      if (!item.fecha_pda) return false
      return now >= getPreviewStart(item.fecha_pda)
    })
  }, [isAdmin, alumnoPuedeVerCalendario, now, pdaList])

  const pdaDestacado = useMemo(() => {
    const base = isAdmin ? pdaList : pdaVisiblesEnCalendario

    if (!base.length) return null

    const hoyItem = base.find((item) => item.fecha_pda === hoy)
    if (hoyItem) return hoyItem

    const futuros = base.filter((item) => item.fecha_pda >= hoy)
    if (futuros.length) return futuros[0]

    return base[base.length - 1] || null
  }, [isAdmin, pdaList, pdaVisiblesEnCalendario, hoy])

  const listadoPda = useMemo(() => {
    return (isAdmin ? pdaList : pdaVisiblesEnCalendario).slice().sort((a, b) => {
      if (a.fecha_pda === hoy && b.fecha_pda !== hoy) return -1
      if (b.fecha_pda === hoy && a.fecha_pda !== hoy) return 1
      return a.fecha_pda.localeCompare(b.fecha_pda)
    })
  }, [isAdmin, pdaList, pdaVisiblesEnCalendario, hoy])

  const historialPasados = useMemo(() => {
    const base = isAdmin ? pdaList : pdaVisiblesEnCalendario

    return [...base]
      .filter((item) => item.fecha_pda < hoy)
      .sort((a, b) => b.fecha_pda.localeCompare(a.fecha_pda))
  }, [isAdmin, pdaList, pdaVisiblesEnCalendario, hoy])

  const rankingOrdenado = useMemo(() => {
    const target = showRanking ? selectedPdaForRanking : pdaDestacado
    if (!target) return []
    return sortRanking(ranking, target.ranking_modo)
  }, [ranking, selectedPdaForRanking, pdaDestacado, showRanking])

  const yaRegistrado = useMemo(() => {
    if (!user || !ranking?.length || !pdaDestacado) return false
    return ranking.some((r) => r.usuario_id === user.id)
  }, [ranking, user, pdaDestacado])

  const alumnoPuedeRegistrar =
    !!pdaDestacado &&
    pdaDestacado.fecha_pda === hoy &&
    pdaDestacado.ranking_modo !== "sin_ranking"

  const adminPuedeRegistrar =
    isAdmin &&
    !!pdaDestacado &&
    pdaDestacado.ranking_modo !== "sin_ranking"

  const puedeRegistrar = isAdmin ? adminPuedeRegistrar : alumnoPuedeRegistrar

  async function handleGuardarResultado(e) {
    e.preventDefault()

    if (!user) {
      alert("No hay sesión activa")
      return
    }

    if (!pdaDestacado) {
      alert("No hay PDA disponible")
      return
    }

    if (!puedeRegistrar) {
      alert("Este PDA no admite registros en este momento")
      return
    }

    if (!isAdmin && yaRegistrado) {
      alert("Ya registraste tu resultado en este PDA")
      return
    }

    const usuarioElegido = isAdmin ? form.usuario_id : user.id

    if (!usuarioElegido) {
      alert("Debes seleccionar un usuario")
      return
    }

    if (!form.resultado_valor || String(form.resultado_valor).trim() === "") {
      alert("Debes ingresar resultado_valor")
      return
    }

    try {
      setSaving(true)

      const payload = {
        pda_id: pdaDestacado.id,
        usuario_id: usuarioElegido,
        resultado_valor: Number(form.resultado_valor),
        resultado_texto: form.resultado_texto?.trim() || null,
        observaciones: form.observaciones?.trim() || null,
        registrado_por: user.id,
      }

      const { error } = await supabase.from("pda_resultados").insert(payload)

      if (error) throw error

      alert("Resultado registrado correctamente")

      setForm((prev) => ({
        ...prev,
        resultado_valor: "",
        resultado_texto: "",
        observaciones: "",
      }))

      setShowRegistro(false)
      await cargarRanking(pdaDestacado.id)
    } catch (err) {
      console.error("Error guardando resultado:", err)
      alert(err.message || "No se pudo guardar el resultado")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 p-6 text-white">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            Cargando PDA...
          </div>
        </div>
      </div>
    )
  }

  if (!isAdmin && !alumnoPuedeVerPagina) {
    return (
      <div className="min-h-screen bg-slate-950 p-6 text-white">
        <div className="mx-auto max-w-6xl">
          <div className="overflow-hidden rounded-3xl border border-yellow-500/20 bg-gradient-to-br from-[#121212] via-slate-950 to-black shadow-2xl">
            <div className="p-8 md:p-10">
              <div className="mb-3 inline-flex rounded-full border border-yellow-400/20 bg-yellow-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-yellow-300">
                PDA Season
              </div>

              <h1 className="text-3xl font-black tracking-tight md:text-5xl">
                Próximamente PDA
              </h1>

              <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-300 md:text-base">
                La temporada PDA estará disponible antes de diciembre.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!isAdmin && !alumnoPuedeVerCalendario) {
    return (
      <div className="min-h-screen bg-slate-950 p-6 text-white">
        <div className="mx-auto max-w-6xl">
          <div className="overflow-hidden rounded-3xl border border-yellow-500/20 bg-gradient-to-br from-[#121212] via-slate-950 to-black shadow-2xl">
            <div className="p-8 md:p-10">
              <div className="mb-3 inline-flex rounded-full border border-yellow-400/20 bg-yellow-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-yellow-300">
                PDA Season
              </div>

              <h1 className="text-3xl font-black tracking-tight md:text-5xl">
                Próximamente PDA
              </h1>

              <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-300 md:text-base">
                El calendario PDA se habilitará 5 horas antes del 1 de diciembre.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="overflow-hidden rounded-3xl border border-yellow-500/20 bg-[#121212] shadow-2xl">
          <div className="border-b border-white/10 bg-black px-5 py-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-[0.25em] text-yellow-300">
                  Calendario Oficial
                </div>
                <h2 className="mt-1 text-3xl font-black tracking-tight text-yellow-300 md:text-4xl">
                  PDA {currentYear}
                </h2>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300">
                Visibles: {pdaVisiblesEnCalendario.length}
              </div>
            </div>
          </div>

          <div className="bg-[#181818] p-4">
            {pdaVisiblesEnCalendario.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-slate-300">
                Aún no hay PDA visibles en el calendario.
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {pdaVisiblesEnCalendario.map((item) => {
                  const esHoy = item.fecha_pda === hoy
                  const esDestacado = pdaDestacado?.id === item.id

                  return (
                    <div
                      key={item.id}
                      className={`overflow-hidden rounded-2xl border ${
                        esHoy
                          ? "border-emerald-400 bg-emerald-500/10"
                          : esDestacado
                          ? "border-yellow-400 bg-yellow-500/10"
                          : "border-white/10 bg-[#202020]"
                      }`}
                    >
                      <div className="grid min-h-[78px] grid-cols-[76px_1fr]">
                        <div
                          className={`flex flex-col items-center justify-center ${
                            esHoy
                              ? "bg-emerald-400 text-slate-950"
                              : esDestacado
                              ? "bg-yellow-400 text-slate-950"
                              : "bg-white text-slate-950"
                          }`}
                        >
                          <div className="text-[10px] font-black uppercase tracking-[0.18em]">
                            DIC
                          </div>
                          <div className="mt-1 text-2xl font-black leading-none">
                            {formatDay(item.fecha_pda)}
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-3 px-4 py-3">
                          <h3 className="text-base font-black uppercase tracking-tight text-white">
                            {item.titulo}
                          </h3>

                          <div className="flex shrink-0 flex-wrap gap-2">
                            {esHoy && (
                              <span className="rounded-full bg-emerald-400 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-950">
                                Hoy
                              </span>
                            )}

                            {!esHoy && esDestacado && (
                              <span className="rounded-full bg-yellow-400 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-950">
                                Próximo
                              </span>
                            )}

                            {isAdmin && !item.fecha_publicacion && (
                              <span className="rounded-full bg-slate-600 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-white">
                                No publicado
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {pdaDestacado && (
          <div className="overflow-hidden rounded-[30px] border border-yellow-500/20 bg-[#070b18] shadow-2xl">
            <div className="grid md:grid-cols-[1.15fr_0.85fr]">
              <div className="p-8 md:p-10">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-yellow-400/20 bg-yellow-500/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.22em] text-yellow-300">
                    PDA
                  </span>

                  {pdaDestacado.fecha_pda === hoy && (
                    <span className="rounded-full border border-emerald-400/20 bg-emerald-500/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.22em] text-emerald-300">
                      Hoy
                    </span>
                  )}

                  {pdaDestacado.fecha_pda !== hoy && (
                    <span className="rounded-full border border-amber-400/20 bg-amber-500/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.22em] text-amber-300">
                      Próximo
                    </span>
                  )}

                  {isAdmin && !pdaDestacado.fecha_publicacion && (
                    <span className="rounded-full border border-slate-400/20 bg-slate-500/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.22em] text-slate-300">
                      No publicado
                    </span>
                  )}
                </div>

                <h1 className="mt-6 text-4xl font-black tracking-tight text-white md:text-5xl">
                  {pdaDestacado.titulo}
                </h1>

                <p className="mt-4 max-w-2xl whitespace-pre-line text-base leading-relaxed text-slate-300">
                  {pdaDestacado.descripcion || "Sin descripción"}
                </p>
              </div>

              <div className="relative min-h-[320px] overflow-hidden">
                <div className="absolute inset-0 bg-[url('/images/pda-crossfit.jpg')] bg-cover bg-center" />
                <div className="absolute inset-0 bg-gradient-to-l from-[#05070f]/90 via-[#05070f]/55 to-[#05070f]/10" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#05070f] via-transparent to-transparent" />

                <div className="absolute right-5 top-5 flex w-[220px] max-w-[calc(100%-40px)] flex-col gap-3">
                  <div className="rounded-2xl border border-white/10 bg-[#131827]/88 p-4 backdrop-blur-md">
                    <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
                      Fecha
                    </div>
                    <div className="mt-2 text-2xl font-black text-white">
                      {formatDate(pdaDestacado.fecha_pda)}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-[#131827]/88 p-4 backdrop-blur-md">
                    <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
                      Ranking
                    </div>
                    <div className="mt-2 text-lg font-black leading-tight text-white">
                      {formatRankingLabel(pdaDestacado.ranking_modo)}
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-5 left-5 right-5 flex flex-wrap gap-3">
                  <button
                    onClick={() => openRankingModal(pdaDestacado)}
                    className="rounded-2xl border border-white/10 bg-black/35 px-5 py-3 text-sm font-bold text-white backdrop-blur-md hover:bg-black/45"
                  >
                    Ver ranking
                  </button>

                  {puedeRegistrar && (
                    <button
                      onClick={() => setShowRegistro(true)}
                      className="rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-bold text-slate-950 hover:bg-yellow-300"
                    >
                      Registrar resultado
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="text-xs uppercase tracking-[0.2em] text-yellow-300">
            Listado PDA
          </div>
          <h2 className="mt-2 text-2xl font-black">PDA visibles</h2>

          {listadoPda.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5 text-slate-300">
              No hay PDA para mostrar todavía.
            </div>
          ) : (
            <>
              {/* Desktop */}
              <div className="mt-6 hidden overflow-hidden rounded-2xl border border-white/10 md:block">
                <div className="grid grid-cols-[1.6fr_140px_180px_140px] bg-white/5 px-4 py-3 text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
                  <div>PDA</div>
                  <div>Fecha</div>
                  <div>Ranking</div>
                  <div>Acción</div>
                </div>

                {listadoPda.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-[1.6fr_140px_180px_140px] items-center border-t border-white/10 px-4 py-4 text-sm"
                  >
                    <div className="pr-4">
                      <div className="font-black text-white">{item.titulo}</div>
                      {isAdmin && !item.fecha_publicacion && (
                        <div className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                          No publicado
                        </div>
                      )}
                    </div>

                    <div className="font-medium text-slate-300">
                      {formatDate(item.fecha_pda)}
                    </div>

                    <div className="font-medium text-slate-300">
                      {formatRankingLabel(item.ranking_modo)}
                    </div>

                    <div>
                      <button
                        onClick={() => openRankingModal(item)}
                        className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-white hover:bg-white/10"
                      >
                        Ver ranking
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Mobile */}
              <div className="mt-6 space-y-3 md:hidden">
                {listadoPda.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-white/10 bg-black/20 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-lg font-black text-white">
                          {item.titulo}
                        </div>
                        {isAdmin && !item.fecha_publicacion && (
                          <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                            No publicado
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => openRankingModal(item)}
                        className="shrink-0 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white hover:bg-white/10"
                      >
                        Ver ranking
                      </button>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                        <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                          Fecha
                        </div>
                        <div className="mt-1 font-bold text-white">
                          {formatDate(item.fecha_pda)}
                        </div>
                      </div>

                      <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                        <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                          Ranking
                        </div>
                        <div className="mt-1 font-bold text-white">
                          {formatRankingLabel(item.ranking_modo)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {historialPasados.length > 0 && (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Historial
            </div>
            <h2 className="mt-2 text-2xl font-black">PDA ya disputados</h2>

            <div className="mt-6 space-y-4">
              {historialPasados.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-white/10 bg-black/20 p-5"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-black">
                          {formatDay(item.fecha_pda)} DIC
                        </div>
                        <div className="text-2xl font-black">{item.titulo}</div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                      {formatDate(item.fecha_pda)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {showRanking && selectedPdaForRanking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-3xl rounded-3xl border border-white/10 bg-slate-900 p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-yellow-300">
                    Ranking PDA
                  </div>
                  <h2 className="text-2xl font-black">{selectedPdaForRanking.titulo}</h2>
                </div>

                <button
                  onClick={() => {
                    setShowRanking(false)
                    setSelectedPdaForRanking(null)
                  }}
                  className="rounded-xl border border-white/10 px-3 py-2 text-sm hover:bg-white/5"
                >
                  Cerrar
                </button>
              </div>

              <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
                <div className="grid grid-cols-[80px_1fr_120px_1fr] bg-white/5 px-4 py-3 text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
                  <div>#</div>
                  <div>Alumno</div>
                  <div>Valor</div>
                  <div>Detalle</div>
                </div>

                {rankingOrdenado.length === 0 ? (
                  <div className="px-4 py-6 text-slate-300">
                    Aún no hay resultados registrados.
                  </div>
                ) : (
                  rankingOrdenado.map((item, index) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-[80px_1fr_120px_1fr] items-center border-t border-white/10 px-4 py-4 text-sm"
                    >
                      <div className="font-black text-yellow-300">
                        {index + 1}
                      </div>
                      <div>{item.usuarios?.nombre || "Sin nombre"}</div>
                      <div className="font-bold">{item.resultado_valor ?? "-"}</div>
                      <div className="text-slate-300">
                        {item.resultado_texto || item.observaciones || "-"}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {showRegistro && puedeRegistrar && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-slate-900 p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-yellow-300">
                    Registro PDA
                  </div>
                  <h2 className="text-2xl font-black">Registrar resultado</h2>
                </div>

                <button
                  onClick={() => setShowRegistro(false)}
                  className="rounded-xl border border-white/10 px-3 py-2 text-sm hover:bg-white/5"
                >
                  Cerrar
                </button>
              </div>

              <form onSubmit={handleGuardarResultado} className="mt-6 space-y-4">
                {isAdmin ? (
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-300">
                      Alumno
                    </label>
                    <select
                      value={form.usuario_id}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, usuario_id: e.target.value }))
                      }
                      className="w-full rounded-2xl border border-white/10 bg-white px-4 py-3 text-slate-950 outline-none"
                    >
                      <option value="">Seleccione un alumno</option>
                      {usuarios.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <div className="text-xs uppercase tracking-[0.15em] text-slate-400">
                      Usuario
                    </div>
                    <div className="mt-1 font-bold">{user?.email}</div>
                  </div>
                )}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-300">
                    Resultado valor
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={form.resultado_valor}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, resultado_valor: e.target.value }))
                    }
                    placeholder="Ej: 12.35 o 150"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-300">
                    Resultado texto
                  </label>
                  <input
                    type="text"
                    value={form.resultado_texto}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, resultado_texto: e.target.value }))
                    }
                    placeholder="Ej: 12:21 / 150 reps"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-300">
                    Observaciones
                  </label>
                  <textarea
                    rows={4}
                    value={form.observaciones}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, observaciones: e.target.value }))
                    }
                    placeholder="Opcional"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-500"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowRegistro(false)}
                    className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-bold hover:bg-white/5"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-bold text-slate-950 hover:bg-yellow-300 disabled:opacity-60"
                  >
                    {saving ? "Guardando..." : "Guardar resultado"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}