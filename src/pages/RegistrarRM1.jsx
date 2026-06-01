import { useEffect, useMemo, useState } from "react"
import { supabase } from "../supabase"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

const DISCOS_CONFIG = [
  { key: "d45", label: "45 lb" },
  { key: "d35", label: "35 lb" },
  { key: "d25", label: "25 lb" },
  { key: "d15", label: "15 lb" },
  { key: "d10", label: "10 lb" },
  { key: "d5", label: "5 lb" },
  { key: "d2_5", label: "2.5 lb" },
  { key: "d1", label: "1 lb" },
  { key: "d0_5", label: "0.5 lb" },
]

const DISCOS_INICIALES = {
  d45: 0,
  d35: 0,
  d25: 0,
  d15: 0,
  d10: 0,
  d5: 0,
  d2_5: 0,
  d1: 0,
  d0_5: 0,
}

function formatearFecha(fecha) {
  if (!fecha) return "-"
  const d = new Date(`${fecha}T00:00:00`)
  if (Number.isNaN(d.getTime())) return fecha
  return d.toLocaleDateString("es-EC", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  })
}

function formatearFechaLarga(fecha) {
  if (!fecha) return "-"
  const d = new Date(`${fecha}T00:00:00`)
  if (Number.isNaN(d.getTime())) return fecha
  return d.toLocaleDateString("es-EC", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/95 px-4 py-3 shadow-2xl">
      <p className="text-sm font-semibold text-white">{label}</p>
      <p className="mt-1 text-sm text-orange-300">{payload[0].value} lb</p>
    </div>
  )
}

export default function RegistrarRM() {
  const [loadingInicial, setLoadingInicial] = useState(true)
  const [guardando, setGuardando] = useState(false)

  const [sessionUserId, setSessionUserId] = useState(null)
  const [rolActual, setRolActual] = useState(null)

  const [alumnos, setAlumnos] = useState([])
  const [ejercicios, setEjercicios] = useState([])
  const [ranking, setRanking] = useState([])

  const [indice, setIndice] = useState(0)
  const [animar, setAnimar] = useState(false)

  const [modalOpen, setModalOpen] = useState(false)

  const [historialModalOpen, setHistorialModalOpen] = useState(false)
  const [loadingHistorial, setLoadingHistorial] = useState(false)
  const [historialAtleta, setHistorialAtleta] = useState([])
  const [atletaSeleccionado, setAtletaSeleccionado] = useState(null)

  const hoy = new Date().toISOString().split("T")[0]

  const [alumnoId, setAlumnoId] = useState("")
  const [ejercicioId, setEjercicioId] = useState("")
  const [fecha, setFecha] = useState(hoy)
  const [tipoBarra, setTipoBarra] = useState(45)
  const [discos, setDiscos] = useState(DISCOS_INICIALES)

  const ejercicioActual = ejercicios[indice] || null
  const esAdminOCoach = rolActual === "Admin" || rolActual === "Coach"

  const totalPorLado = useMemo(() => {
    return (
      discos.d45 * 45 +
      discos.d35 * 35 +
      discos.d25 * 25 +
      discos.d15 * 15 +
      discos.d10 * 10 +
      discos.d5 * 5 +
      discos.d2_5 * 2.5 +
      discos.d1 * 1 +
      discos.d0_5 * 0.5
    )
  }, [discos])

  const total = useMemo(() => tipoBarra + totalPorLado * 2, [tipoBarra, totalPorLado])

  const maxPeso = ranking[0]?.mejor_rm || 1
  const top3 = ranking.slice(0, 3)
  const restoRanking = ranking.slice(3, 20)

  const chartData = useMemo(() => {
    return [...historialAtleta]
      .sort((a, b) => {
        const fechaA = new Date(`${a.fecha}T00:00:00`).getTime()
        const fechaB = new Date(`${b.fecha}T00:00:00`).getTime()
        return fechaA - fechaB
      })
      .map((item, index) => ({
        fecha: formatearFecha(item.fecha),
        peso: Number(item.peso_libras) || 0,
        fechaRaw: item.fecha,
        index,
      }))
  }, [historialAtleta])

  const historialReciente = useMemo(() => {
    return [...historialAtleta]
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
      .slice(0, 8)
  }, [historialAtleta])

  useEffect(() => {
    inicializar()
  }, [])

  useEffect(() => {
    if (ejercicios.length === 0) return

    const interval = setInterval(() => {
      setIndice((prev) => (prev + 1) % ejercicios.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [ejercicios])

  useEffect(() => {
    if (!ejercicioActual) return

    setAnimar(true)
    obtenerRanking(ejercicioActual.id)

    const timeout = setTimeout(() => {
      setAnimar(false)
    }, 350)

    return () => clearTimeout(timeout)
  }, [ejercicioActual])

  async function inicializar() {
    try {
      setLoadingInicial(true)

      const { data: sessionData } = await supabase.auth.getSession()
      const userId = sessionData?.session?.user?.id || null
      setSessionUserId(userId)

      if (!userId) {
        setLoadingInicial(false)
        return
      }

      const [perfilRes, ejerciciosRes, alumnosRes] = await Promise.all([
        supabase
          .from("perfiles")
          .select("rol, nombre")
          .eq("id", userId)
          .single(),
        supabase.from("ejercicios").select("id, nombre").order("nombre"),
        supabase
          .from("usuarios")
          .select("id, nombre")
          .eq("role", "Alumno")
          .order("nombre"),
      ])

      if (perfilRes.error) {
        console.error("Error cargando perfil:", perfilRes.error)
      } else {
        setRolActual(perfilRes.data?.rol || null)
      }

      if (ejerciciosRes.error) {
        console.error("Error cargando ejercicios:", ejerciciosRes.error)
      } else {
        const ejerciciosData = ejerciciosRes.data || []
        setEjercicios(ejerciciosData)
        if (ejerciciosData.length > 0) {
          setEjercicioId(ejerciciosData[0].id)
        }
      }

      if (alumnosRes.error) {
        console.error("Error cargando alumnos:", alumnosRes.error)
      } else {
        setAlumnos(alumnosRes.data || [])
      }

      if (perfilRes.data?.rol === "Alumno") {
        setAlumnoId(userId)
      }
    } finally {
      setLoadingInicial(false)
    }
  }

  async function obtenerRanking(ejercicioIdParam) {
    const { data, error } = await supabase.rpc("top20_por_ejercicio", {
      ejercicio_id_param: ejercicioIdParam,
    })

    if (error) {
      console.error("Error cargando ranking:", error)
      setRanking([])
      return
    }

    setRanking(data || [])
  }

  function abrirModal() {
    if (!sessionUserId) {
      alert("Sesión no encontrada")
      return
    }

    setFecha(hoy)
    setTipoBarra(45)
    setDiscos(DISCOS_INICIALES)
    setEjercicioId(ejercicioActual?.id || ejercicios[0]?.id || "")
    setAlumnoId(esAdminOCoach ? "" : sessionUserId)
    setModalOpen(true)
  }

  function cerrarModal() {
    if (guardando) return
    setModalOpen(false)
  }

  function cambiarDisco(key, value) {
    const limpio = value === "" ? 0 : Number(value)
    setDiscos((prev) => ({
      ...prev,
      [key]: Number.isNaN(limpio) ? 0 : limpio,
    }))
  }

  async function handleGuardar(e) {
    e.preventDefault()

    if (!sessionUserId) {
      alert("Sesión no encontrada")
      return
    }

    if (!alumnoId || !ejercicioId || !fecha) {
      alert("Completa todos los campos")
      return
    }

    if (total <= 0) {
      alert("El peso total debe ser mayor a 0")
      return
    }

    try {
      setGuardando(true)

      const { data, error } = await supabase
        .from("rm")
        .insert({
          usuario: alumnoId,
          ejercicio_id: ejercicioId,
          peso_libras: total,
          fecha,
          registrado_por: sessionUserId,
        })
        .select()

      if (error) {
        console.error("Error insertando RM:", error)
        alert("Error al guardar RM")
        return
      }

      if (!data || data.length === 0) {
        alert("No se pudo confirmar el guardado")
        return
      }

      await obtenerRanking(ejercicioId)

      alert("RM registrado correctamente")
      setModalOpen(false)
      setFecha(hoy)
      setTipoBarra(45)
      setDiscos(DISCOS_INICIALES)

      if (esAdminOCoach) {
        setAlumnoId("")
      } else {
        setAlumnoId(sessionUserId)
      }
    } finally {
      setGuardando(false)
    }
  }

  function siguiente() {
    if (ejercicios.length === 0) return
    setIndice((prev) => (prev + 1) % ejercicios.length)
  }

  function anterior() {
    if (ejercicios.length === 0) return
    setIndice((prev) => (prev - 1 + ejercicios.length) % ejercicios.length)
  }

  async function abrirHistorialAtleta(item) {
    if (!ejercicioActual?.id) return

    setHistorialModalOpen(true)
    setLoadingHistorial(true)
    setAtletaSeleccionado({
      usuario_id: item.usuario_id,
      nombre: item.nombre,
      ejercicio_id: ejercicioActual.id,
      ejercicio_nombre: ejercicioActual.nombre,
      mejor_rm: item.mejor_rm,
    })
    setHistorialAtleta([])

    const { data, error } = await supabase
      .from("rm")
      .select("id, fecha, peso_libras")
      .eq("usuario", item.usuario_id)
      .eq("ejercicio_id", ejercicioActual.id)
      .order("fecha", { ascending: true })

    if (error) {
      console.error("Error cargando historial RM:", error)
      setHistorialAtleta([])
      setLoadingHistorial(false)
      return
    }

    setHistorialAtleta(data || [])
    setLoadingHistorial(false)
  }

  function cerrarHistorialModal() {
    if (loadingHistorial) return
    setHistorialModalOpen(false)
    setAtletaSeleccionado(null)
    setHistorialAtleta([])
  }

  if (loadingInicial) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4">
        <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-4 backdrop-blur-xl">
          Cargando módulo RM...
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white px-4 py-6 md:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-orange-500/20 bg-white/5 p-5 shadow-2xl backdrop-blur-xl md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-orange-400/20 bg-orange-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-orange-300">
              RM Module
            </div>

            <h1 className="text-2xl font-black tracking-tight md:text-4xl">
              Records Personales
            </h1>

            <p className="mt-2 text-sm text-slate-300 md:text-base">
              Ranking por ejercicio, top 20 y registro rápido de nuevos RM.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={anterior}
              className="h-11 w-11 rounded-2xl border border-white/10 bg-white/5 text-xl transition hover:border-orange-400/40 hover:bg-white/10"
              aria-label="Anterior"
            >
              ‹
            </button>

            <button
              onClick={siguiente}
              className="h-11 w-11 rounded-2xl border border-white/10 bg-white/5 text-xl transition hover:border-orange-400/40 hover:bg-white/10"
              aria-label="Siguiente"
            >
              ›
            </button>

            <button
              onClick={abrirModal}
              className="rounded-2xl bg-gradient-to-r from-orange-500 to-amber-400 px-5 py-3 font-bold text-slate-950 shadow-lg shadow-orange-500/20 transition hover:scale-[1.02]"
            >
              + Nuevo RM
            </button>
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
              Ejercicio actual
            </p>
            <h2 className="mt-1 text-2xl font-extrabold text-white">
              {ejercicioActual?.nombre || "Sin ejercicios"}
            </h2>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
            {ejercicios.length > 0 ? `${indice + 1} / ${ejercicios.length}` : "0 / 0"}
          </div>
        </div>

        <div
          className={`rounded-[28px] border border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-4 shadow-2xl transition-all duration-300 md:p-6 ${
            animar ? "translate-y-2 opacity-80" : "translate-y-0 opacity-100"
          }`}
        >
          {ranking.length === 0 ? (
            <div className="flex min-h-[320px] items-center justify-center rounded-3xl border border-dashed border-white/10 bg-white/5 text-center text-slate-300">
              No hay registros todavía para este ejercicio.
            </div>
          ) : (
            <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
              <div className="rounded-3xl border border-orange-400/20 bg-orange-500/5 p-4">
                <div className="mb-4">
                  <p className="text-xs uppercase tracking-[0.25em] text-orange-300">
                    Podio
                  </p>
                  <h3 className="mt-1 text-xl font-black">Top 3</h3>
                </div>

                <div className="space-y-3">
                  {top3.map((item, i) => {
                    const esUsuarioActual = item.usuario_id === sessionUserId
                    const porcentaje = Math.max((item.mejor_rm / maxPeso) * 100, 6)

                    return (
                      <div
                        key={`${item.usuario_id}-${i}`}
                        className={`rounded-2xl border p-4 ${
                          esUsuarioActual
                            ? "border-emerald-400/50 bg-emerald-500/10"
                            : "border-white/10 bg-white/5"
                        }`}
                      >
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 font-black">
                              #{i + 1}
                            </div>
                            <div>
                              <button
                                type="button"
                                onClick={() => abrirHistorialAtleta(item)}
                                className="text-left font-bold leading-tight transition hover:text-orange-300"
                              >
                                {item.nombre}{" "}
                                {esUsuarioActual ? (
                                  <span className="text-emerald-300">(TÚ)</span>
                                ) : null}
                              </button>
                              <p className="text-sm text-slate-400">Mejor marca</p>
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="text-xl font-black text-orange-300">
                              {item.mejor_rm} lb
                            </p>
                          </div>
                        </div>

                        <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-orange-400 to-amber-300 transition-all duration-500"
                            style={{ width: `${porcentaje}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                      Ranking extendido
                    </p>
                    <h3 className="mt-1 text-xl font-black">Top 20</h3>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-slate-900/60 px-3 py-1 text-sm text-slate-300">
                    Actualiza cada 5s
                  </div>
                </div>

                <div className="space-y-2">
                  {restoRanking.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-white/10 bg-slate-900/40 p-4 text-slate-400">
                      Aún no hay suficientes registros para mostrar del puesto 4 al 20.
                    </div>
                  ) : (
                    restoRanking.map((item, idx) => {
                      const posicionReal = idx + 4
                      const esUsuarioActual = item.usuario_id === sessionUserId
                      const porcentaje = Math.max((item.mejor_rm / maxPeso) * 100, 4)

                      return (
                        <div
                          key={`${item.usuario_id}-${posicionReal}`}
                          className={`grid items-center gap-3 rounded-2xl border p-3 md:grid-cols-[70px_1fr_110px] ${
                            esUsuarioActual
                              ? "border-emerald-400/50 bg-emerald-500/10"
                              : "border-white/10 bg-slate-900/50"
                          }`}
                        >
                          <div className="text-sm font-black text-slate-300">
                            #{posicionReal}
                          </div>

                          <div>
                            <div className="flex items-center justify-between gap-3">
                              <button
                                type="button"
                                onClick={() => abrirHistorialAtleta(item)}
                                className="text-left font-semibold transition hover:text-orange-300"
                              >
                                {item.nombre}{" "}
                                {esUsuarioActual ? (
                                  <span className="text-emerald-300">(TÚ)</span>
                                ) : null}
                              </button>
                            </div>

                            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all duration-500"
                                style={{ width: `${porcentaje}%` }}
                              />
                            </div>
                          </div>

                          <div className="text-right text-base font-black text-white">
                            {item.mejor_rm} lb
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {ejercicios.length > 1 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {ejercicios.map((ejercicio, i) => (
              <button
                key={ejercicio.id}
                onClick={() => setIndice(i)}
                className={`rounded-full px-4 py-2 text-sm transition ${
                  i === indice
                    ? "bg-orange-500 text-slate-950 font-bold"
                    : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                }`}
              >
                {ejercicio.nombre}
              </button>
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[28px] border border-white/10 bg-slate-950 p-5 shadow-2xl md:p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-orange-300">
                  Nuevo récord
                </p>
                <h3 className="mt-1 text-2xl font-black">Registrar RM</h3>
              </div>

              <button
                onClick={cerrarModal}
                className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10"
              >
                Cerrar
              </button>
            </div>

            <form onSubmit={handleGuardar} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                {esAdminOCoach ? (
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-300">
                      Alumno
                    </label>
                    <select
                      value={alumnoId}
                      onChange={(e) => setAlumnoId(e.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-orange-400/40"
                    >
                      <option value="">Seleccionar alumno</option>
                      {alumnos.map((a) => (
                        <option key={a.id} value={a.id} className="bg-slate-900">
                          {a.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-300">
                      Alumno
                    </label>
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-slate-200">
                      Tu usuario actual
                    </div>
                  </div>
                )}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-300">
                    Ejercicio
                  </label>
                  <select
                    value={ejercicioId}
                    onChange={(e) => setEjercicioId(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-orange-400/40"
                  >
                    <option value="">Seleccionar ejercicio</option>
                    {ejercicios.map((ejer) => (
                      <option key={ejer.id} value={ejer.id} className="bg-slate-900">
                        {ejer.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-300">
                    Fecha
                  </label>
                  <input
                    type="date"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-orange-400/40"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-300">
                    Tipo de barra
                  </label>
                  <select
                    value={tipoBarra}
                    onChange={(e) => setTipoBarra(Number(e.target.value))}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-orange-400/40"
                  >
                    <option value={45} className="bg-slate-900">
                      Barra 45 lb (Hombre)
                    </option>
                    <option value={35} className="bg-slate-900">
                      Barra 35 lb (Mujer)
                    </option>
                    <option value={25} className="bg-slate-900">
                      Barra 25 lb (Principiantes)
                    </option>
                  </select>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                      Calculadora
                    </p>
                    <h4 className="mt-1 text-lg font-black">Discos por lado</h4>
                  </div>

                  <div className="rounded-2xl border border-orange-400/20 bg-orange-500/10 px-4 py-2 text-right">
                    <p className="text-xs text-orange-200">Peso total</p>
                    <p className="text-2xl font-black text-orange-300">{total} lb</p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {DISCOS_CONFIG.map((disco) => (
                    <div key={disco.key}>
                      <label className="mb-2 block text-sm font-semibold text-slate-300">
                        {disco.label}
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={discos[disco.key] === 0 ? "" : discos[disco.key]}
                        onChange={(e) => cambiarDisco(disco.key, e.target.value)}
                        className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white outline-none transition focus:border-orange-400/40"
                        placeholder="0"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={cerrarModal}
                  className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-semibold text-slate-300 transition hover:bg-white/10"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={guardando}
                  className="rounded-2xl bg-gradient-to-r from-orange-500 to-amber-400 px-5 py-3 font-black text-slate-950 shadow-lg shadow-orange-500/20 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {guardando ? "Guardando..." : "Guardar RM"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {historialModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 px-4 py-6 backdrop-blur-sm">
          <div className="max-h-[94vh] w-full max-w-4xl overflow-y-auto rounded-[30px] border border-white/10 bg-slate-950 p-5 shadow-2xl md:p-6">
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-orange-300">
                  Evolución RM
                </p>
                <h3 className="mt-1 text-2xl font-black md:text-3xl">
                  {atletaSeleccionado?.nombre || "Atleta"}
                </h3>
                <p className="mt-2 text-sm text-slate-300">
                  Ejercicio:{" "}
                  <span className="font-semibold text-white">
                    {atletaSeleccionado?.ejercicio_nombre || "-"}
                  </span>
                </p>
              </div>

              <button
                onClick={cerrarHistorialModal}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/10"
              >
                Cerrar
              </button>
            </div>

            {loadingHistorial ? (
              <div className="flex min-h-[320px] items-center justify-center rounded-3xl border border-white/10 bg-white/5 text-slate-300">
                Cargando historial...
              </div>
            ) : (
              <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4 md:p-5">
                  <div className="mb-4">
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                      Gráfico
                    </p>
                    <h4 className="mt-1 text-xl font-black">Evolución por fecha</h4>
                  </div>

                  {chartData.length === 0 ? (
                    <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-white/10 bg-slate-900/40 text-slate-400">
                      No hay datos para graficar.
                    </div>
                  ) : (
                    <div className="h-[360px] w-full overflow-x-auto">
                      <ResponsiveContainer
                        width={Math.max(chartData.length * 40, 400)}
                        height="100%"
                      >
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis
                            dataKey="fecha"
                            stroke="#94a3b8"
                            tick={{ fill: "#94a3b8", fontSize: 11 }}
                            interval={chartData.length > 20 ? 2 : 0}
                            angle={chartData.length > 15 ? -25 : 0}
                            textAnchor="end"
                            height={chartData.length > 15 ? 60 : 30}
                          />
                          <YAxis
                            stroke="#94a3b8"
                            tick={{ fill: "#94a3b8", fontSize: 12 }}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar dataKey="peso" radius={[8, 8, 0, 0]} fill="#f59e0b" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/5 p-4 md:p-5">
                  <div className="mb-4">
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                      Historial
                    </p>
                    <h4 className="mt-1 text-xl font-black">Registros recientes</h4>
                  </div>

                  {historialReciente.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-white/10 bg-slate-900/40 p-4 text-slate-400">
                      No hay registros todavía.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {historialReciente.map((registro) => (
                        <div
                          key={registro.id}
                          className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-900/50 px-4 py-3"
                        >
                          <div>
                            <p className="font-semibold text-white">
                              {registro.peso_libras} lb
                            </p>
                            <p className="text-sm text-slate-400">
                              {formatearFechaLarga(registro.fecha)}
                            </p>
                          </div>

                          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                            RM
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}