import { useEffect, useMemo, useState } from "react"
import { supabase } from "../../supabase"

const ESTADO_STYLES = {
  registrado: "bg-amber-500/15 text-amber-300 border border-amber-400/20",
  inscrito: "bg-emerald-500/15 text-emerald-300 border border-emerald-400/20",
}

const initialForm = {
  nombres: "",
  apellidos: "",
  categoria_id: "",
  estado: "registrado",
}

export default function CompetidoresAdmin() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [categorias, setCategorias] = useState([])
  const [inscripciones, setInscripciones] = useState([])

  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(initialForm)

  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)

      const { data: categoriasData } = await supabase
        .from("competencia_categorias")
        .select("*")
        .eq("activo", true)

      const { data: inscripcionesData } = await supabase
        .from("v_competencia_inscripciones")
        .select("*")
        .order("created_at", { ascending: true })

      setCategorias(categoriasData || [])
      setInscripciones(inscripcionesData || [])
    } catch (err) {
      console.error(err)
      setError("Error cargando competidores")
    } finally {
      setLoading(false)
    }
  }

  function openModal() {
    setForm(initialForm)
    setShowModal(true)
  }

  function closeModal() {
    if (saving) return
    setShowModal(false)
  }

  function onChange(field, value) {
    setForm({ ...form, [field]: value })
  }

  async function handleSave(e) {
    e.preventDefault()

    if (!form.nombres || !form.categoria_id) {
      setError("Completa los campos obligatorios")
      return
    }

    try {
      setSaving(true)

      // crear competidor
      const { data: comp } = await supabase
        .from("competidores")
        .insert({
          nombres: form.nombres,
          apellidos: form.apellidos,
        })
        .select()
        .single()

      // crear inscripción (SIN competencia)
      await supabase.from("competencia_inscripciones").insert({
        competidor_id: comp.id,
        categoria_id: form.categoria_id,
        estado: form.estado,
      })

      setShowModal(false)
      loadData()
    } catch (err) {
      console.error(err)
      setError("Error al registrar")
    } finally {
      setSaving(false)
    }
  }

  async function changeEstado(id, estado) {
    await supabase
      .from("competencia_inscripciones")
      .update({ estado })
      .eq("id", id)

    loadData()
  }

  const grouped = useMemo(() => {
    return categorias.map((cat) => ({
      ...cat,
      items: inscripciones.filter((i) => i.categoria_id === cat.id),
    }))
  }, [categorias, inscripciones])

  return (
    <div className="min-h-screen bg-[#050816] text-white p-6">
      <div className="max-w-6xl mx-auto">

        <div className="flex justify-between mb-6">
          <h1 className="text-3xl font-black">Competidores</h1>

          <button
            onClick={openModal}
            className="bg-cyan-400 text-black px-4 py-2 rounded-xl font-bold"
          >
            + Registrar competidor
          </button>
        </div>

        {loading ? (
          <p>Cargando...</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-5">
            {grouped.map((cat) => (
              <div key={cat.id} className="bg-white/5 p-5 rounded-3xl border border-white/10">
                <h2 className="text-xl font-bold mb-4">
                  {cat.nombre} ({cat.items.length})
                </h2>

                {cat.items.length === 0 ? (
                  <p className="text-white/40">Sin competidores</p>
                ) : (
                  <div className="space-y-2">
                    {cat.items.map((c) => (
                      <div
                        key={c.id}
                        className="flex justify-between items-center bg-black/30 px-3 py-2 rounded-xl"
                      >
                        <span>{c.competidor_nombre}</span>

                        <select
                          value={c.estado}
                          onChange={(e) => changeEstado(c.id, e.target.value)}
                          className={`text-xs px-2 py-1 rounded-full ${
                            c.estado === "inscrito"
                              ? "bg-green-500/20 text-green-300"
                              : "bg-yellow-500/20 text-yellow-300"
                          }`}
                        >
                          <option value="registrado">Registrado</option>
                          <option value="inscrito">Inscrito</option>
                        </select>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center">
          <form
            onSubmit={handleSave}
            className="bg-[#071122] p-6 rounded-3xl w-full max-w-md space-y-4"
          >
            <h2 className="text-xl font-bold">Registrar competidor</h2>

            <input
              placeholder="Nombres"
              value={form.nombres}
              onChange={(e) => onChange("nombres", e.target.value)}
              className="w-full p-3 bg-black/30 rounded-xl"
            />

            <input
              placeholder="Apellidos"
              value={form.apellidos}
              onChange={(e) => onChange("apellidos", e.target.value)}
              className="w-full p-3 bg-black/30 rounded-xl"
            />

            <select
              value={form.categoria_id}
              onChange={(e) => onChange("categoria_id", e.target.value)}
              className="w-full p-3 bg-black/30 rounded-xl"
            >
              <option value="">Categoría</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>

            <select
              value={form.estado}
              onChange={(e) => onChange("estado", e.target.value)}
              className="w-full p-3 bg-black/30 rounded-xl"
            >
              <option value="registrado">Registrado</option>
              <option value="inscrito">Inscrito</option>
            </select>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="flex-1 bg-white/10 p-3 rounded-xl"
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="flex-1 bg-cyan-400 text-black p-3 rounded-xl font-bold"
              >
                Guardar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}