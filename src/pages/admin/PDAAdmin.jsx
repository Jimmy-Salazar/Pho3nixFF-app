import { useEffect, useMemo, useRef, useState } from "react"
import { supabase } from "../../supabase"

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

function formatDateTime(value) {
  if (!value) return "Sin publicar"
  const date = new Date(value)
  return date.toLocaleString()
}

const INITIAL_FORM = {
  titulo: "",
  descripcion: "",
  ranking_modo: "menor_es_mejor",
  fecha_pda: "",
}

export default function PDAAdmin() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [items, setItems] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(INITIAL_FORM)

  const itemRefs = useRef({})
  const hoy = getTodayLocalDate()

  async function cargarPdas() {
    try {
      setLoading(true)

      try {
        await supabase.rpc("sync_pda_estados")
      } catch (e) {
        console.warn("No se pudo sincronizar PDA automáticamente:", e)
      }

      const { data, error } = await supabase
        .from("pda")
        .select("*")
        .order("fecha_pda", { ascending: true, nullsFirst: false })

      if (error) throw error
      setItems(data || [])
    } catch (err) {
      console.error("Error cargando PDA:", err)
      alert(err.message || "No se pudieron cargar los PDA")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarPdas()
  }, [])

  function resetForm() {
    setForm(INITIAL_FORM)
    setEditingId(null)
  }

  function handleChange(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  function pdaYaPaso(item) {
    return !!item.fecha_pda && item.fecha_pda < hoy
  }

  async function handleSubmit(e) {
    e.preventDefault()

    if (!form.titulo.trim()) {
      alert("El título es obligatorio")
      return
    }

    try {
      setSaving(true)

      const { data: authData, error: authErr } = await supabase.auth.getUser()
      if (authErr) throw authErr

      const authUser = authData?.user
      if (!authUser?.id) {
        throw new Error("No hay usuario autenticado")
      }

      const payload = {
        titulo: form.titulo.trim(),
        descripcion: form.descripcion.trim() || null,
        ranking_modo: form.ranking_modo,
        fecha_pda: form.fecha_pda || null,
      }

      if (editingId) {
        const actual = items.find((x) => x.id === editingId)
        if (actual && pdaYaPaso(actual)) {
          alert("No se puede editar un PDA cuya fecha ya pasó")
          return
        }

        const { error } = await supabase
          .from("pda")
          .update(payload)
          .eq("id", editingId)

        if (error) throw error

        alert("PDA actualizado correctamente")
      } else {
        const { error } = await supabase.from("pda").insert({
          ...payload,
          created_by: authUser.id,
          estado: "pendiente",
          fecha_publicacion: null,
        })

        if (error) throw error

        alert("PDA creado correctamente")
      }

      resetForm()
      await cargarPdas()
    } catch (err) {
      console.error("Error guardando PDA:", err)
      alert(err.message || "No se pudo guardar el PDA")
    } finally {
      setSaving(false)
    }
  }

  function handleEdit(item) {
    if (pdaYaPaso(item)) {
      alert("No se puede editar un PDA cuya fecha ya pasó")
      return
    }

    setEditingId(item.id)
    setForm({
      titulo: item.titulo || "",
      descripcion: item.descripcion || "",
      ranking_modo: item.ranking_modo || "menor_es_mejor",
      fecha_pda: item.fecha_pda || "",
    })

    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function handleQuickOpen(item) {
    if (!pdaYaPaso(item)) {
      setEditingId(item.id)
      setForm({
        titulo: item.titulo || "",
        descripcion: item.descripcion || "",
        ranking_modo: item.ranking_modo || "menor_es_mejor",
        fecha_pda: item.fecha_pda || "",
      })
    } else {
      resetForm()
    }

    setTimeout(() => {
      const el = itemRefs.current[item.id]
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" })
      }
    }, 100)
  }

  async function handlePublicar(item) {
    if (!item.fecha_pda) {
      alert("Debes asignar una fecha antes de publicar")
      return
    }

    if (pdaYaPaso(item)) {
      alert("No se puede publicar un PDA cuya fecha ya pasó")
      return
    }

    const confirmar = window.confirm(`¿Dejar listo para publicación el PDA "${item.titulo}"?`)
    if (!confirmar) return

    try {
      const { error } = await supabase
        .from("pda")
        .update({
          fecha_publicacion: new Date().toISOString(),
        })
        .eq("id", item.id)

      if (error) throw error

      try {
        await supabase.rpc("sync_pda_estados")
      } catch (e) {
        console.warn("No se pudo sincronizar PDA automáticamente:", e)
      }

      alert("PDA listo para publicación")
      await cargarPdas()
    } catch (err) {
      console.error("Error publicando PDA:", err)
      alert(err.message || "No se pudo publicar el PDA")
    }
  }

  async function handleDelete(item) {
    const confirmar = window.confirm(`¿Eliminar el PDA "${item.titulo}"? Esta acción no se puede deshacer.`)
    if (!confirmar) return

    try {
      const { error } = await supabase.from("pda").delete().eq("id", item.id)

      if (error) throw error

      if (editingId === item.id) resetForm()

      alert("PDA eliminado correctamente")
      await cargarPdas()
    } catch (err) {
      console.error("Error eliminando PDA:", err)
      alert(err.message || "No se pudo eliminar el PDA")
    }
  }

  const quickList = useMemo(() => {
    return [...items].sort((a, b) => {
      const aDate = a.fecha_pda || "9999-12-31"
      const bDate = b.fecha_pda || "9999-12-31"
      return aDate.localeCompare(bDate)
    })
  }, [items])

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <div className="text-sm uppercase tracking-[0.25em] text-cyan-300">
            Admin PDA
          </div>
          <h1 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">
            Gestión de PDA
          </h1>
          <p className="mt-2 text-slate-300">
            Crea, publica y administra los PDA de diciembre.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[460px_1fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-cyan-300">
                    {editingId ? "Editar PDA" : "Nuevo PDA"}
                  </div>
                  <h2 className="mt-2 text-2xl font-black">
                    {editingId ? "Actualizar PDA" : "Crear PDA"}
                  </h2>
                </div>

                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-2xl border border-white/10 px-4 py-2 text-sm font-bold hover:bg-white/5"
                  >
                    Cancelar edición
                  </button>
                )}
              </div>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-300">
                    Título
                  </label>
                  <input
                    type="text"
                    value={form.titulo}
                    onChange={(e) => handleChange("titulo", e.target.value)}
                    placeholder="Ej: PDA Benchmark 1"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-300">
                    Descripción
                  </label>
                  <textarea
                    rows={5}
                    value={form.descripcion}
                    onChange={(e) => handleChange("descripcion", e.target.value)}
                    placeholder="Describe el benchmark, reglas, reps, time cap..."
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-300">
                    Ranking
                  </label>
                  <select
                    value={form.ranking_modo}
                    onChange={(e) => handleChange("ranking_modo", e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white px-4 py-3 text-slate-950 outline-none"
                  >
                    <option value="menor_es_mejor">menor_es_mejor</option>
                    <option value="mayor_es_mejor">mayor_es_mejor</option>
                    <option value="sin_ranking">sin_ranking</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-300">
                    Fecha PDA
                  </label>
                  <input
                    type="date"
                    value={form.fecha_pda}
                    onChange={(e) => handleChange("fecha_pda", e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                  />
                  <p className="mt-2 text-xs text-slate-500">
                    Solo se aceptan fechas de diciembre. La validación final la hace SQL.
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-bold hover:bg-white/5"
                  >
                    Limpiar
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-2xl bg-cyan-500 px-5 py-3 text-sm font-bold text-slate-950 hover:bg-cyan-400 disabled:opacity-60"
                  >
                    {saving ? "Guardando..." : editingId ? "Actualizar PDA" : "Crear PDA"}
                  </button>
                </div>
              </form>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="text-xs uppercase tracking-[0.2em] text-cyan-300">
                Acceso rápido
              </div>
              <h2 className="mt-2 text-2xl font-black">PDA programados</h2>

              {loading ? (
                <div className="mt-4 text-slate-300">Cargando lista...</div>
              ) : quickList.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4 text-slate-300">
                  Aún no hay PDA creados.
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {quickList.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleQuickOpen(item)}
                      className="w-full rounded-2xl border border-white/10 bg-black/20 p-4 text-left transition hover:bg-white/5"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-bold text-white">
                            {item.titulo}
                          </div>
                          <div className="mt-1 text-xs text-slate-400">
                            PDA: {formatDate(item.fecha_pda)}
                          </div>
                          <div className="text-xs text-slate-500">
                            Publicación: {formatDateTime(item.fecha_publicacion)}
                          </div>
                        </div>

                        <div className="flex shrink-0 flex-col items-end gap-2">
                          {item.fecha_publicacion ? (
                            <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.15em] text-emerald-300">
                              Publicado
                            </span>
                          ) : (
                            <span className="rounded-full border border-slate-400/20 bg-slate-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.15em] text-slate-300">
                              Borrador
                            </span>
                          )}

                          {pdaYaPaso(item) && (
                            <span className="rounded-full border border-rose-400/20 bg-rose-400/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.15em] text-rose-300">
                              Cerrado
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-cyan-300">
                  Historial
                </div>
                <h2 className="mt-2 text-2xl font-black">PDA creados</h2>
              </div>

              <button
                type="button"
                onClick={cargarPdas}
                className="rounded-2xl border border-white/10 px-4 py-2 text-sm font-bold hover:bg-white/5"
              >
                Recargar
              </button>
            </div>

            {loading ? (
              <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-6">
                Cargando PDA...
              </div>
            ) : items.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-6 text-slate-300">
                Aún no hay PDA creados.
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    ref={(el) => {
                      itemRefs.current[item.id] = el
                    }}
                    className={`rounded-3xl border p-5 ${
                      editingId === item.id
                        ? "border-cyan-400/40 bg-cyan-500/5"
                        : "border-white/10 bg-black/20"
                    }`}
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">
                            PDA
                          </span>

                          {item.fecha_publicacion ? (
                            <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">
                              publicado
                            </span>
                          ) : (
                            <span className="rounded-full border border-slate-400/20 bg-slate-500/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-slate-300">
                              borrador
                            </span>
                          )}

                          {pdaYaPaso(item) && (
                            <span className="rounded-full border border-rose-400/20 bg-rose-400/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-rose-300">
                              fecha pasada
                            </span>
                          )}
                        </div>

                        <h3 className="mt-4 text-2xl font-black">{item.titulo}</h3>

                        <p className="mt-3 whitespace-pre-line text-slate-300">
                          {item.descripcion || "Sin descripción"}
                        </p>

                        <div className="mt-4 grid gap-3 sm:grid-cols-3">
                          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                            <div className="text-xs uppercase tracking-[0.15em] text-slate-400">
                              Fecha PDA
                            </div>
                            <div className="mt-1 font-bold">{formatDate(item.fecha_pda)}</div>
                          </div>

                          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                            <div className="text-xs uppercase tracking-[0.15em] text-slate-400">
                              Ranking
                            </div>
                            <div className="mt-1 font-bold">{item.ranking_modo}</div>
                          </div>

                          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                            <div className="text-xs uppercase tracking-[0.15em] text-slate-400">
                              Publicación
                            </div>
                            <div className="mt-1 font-bold">{formatDateTime(item.fecha_publicacion)}</div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 xl:w-[220px] xl:justify-end">
                        <button
                          type="button"
                          onClick={() => handleEdit(item)}
                          disabled={pdaYaPaso(item)}
                          className="rounded-2xl border border-white/10 px-4 py-2 text-sm font-bold hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          onClick={() => handlePublicar(item)}
                          disabled={pdaYaPaso(item)}
                          className="rounded-2xl bg-cyan-500 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Publicar
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(item)}
                          className="rounded-2xl border border-white/10 px-4 py-2 text-sm font-bold hover:bg-white/5"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}