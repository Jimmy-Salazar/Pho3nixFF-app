import { useEffect, useState } from "react"
import { supabase } from "../supabase"

export default function Competencias() {
  const [loading, setLoading] = useState(true)
  const [competencias, setCompetencias] = useState([])

  useEffect(() => {
    loadCompetencias()
  }, [])

  async function loadCompetencias() {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from("competencias")
        .select("*")
        .eq("activo", true)
        .eq("estado", "publicada")
        .order("fecha_inicio_competencia", { ascending: true })

      if (error) throw error

      const now = new Date()

      const visibles = (data || []).filter((c) => {
        const start = new Date(c.fecha_publicacion)
        const end = new Date(c.fecha_fin_publicacion)
        return now >= start && now <= end
      })

      setCompetencias(visibles)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-6 text-white md:px-6">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-black">Competencias</h1>
        <p className="mt-2 text-sm text-white/60">
          Eventos activos del box durante el mes actual.
        </p>

        {loading ? (
          <div className="mt-10 text-white/60">Cargando competencias...</div>
        ) : competencias.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-6 text-center text-white/50">
            No hay competencias activas en este momento.
          </div>
        ) : (
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {competencias.map((c) => (
              <CompetenciaCard key={c.id} item={c} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function CompetenciaCard({ item }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase text-cyan-300">Competencia</span>

        <span className="text-xs text-white/50">
          {formatDate(item.fecha_inicio_competencia)}
        </span>
      </div>

      <h2 className="mt-4 text-2xl font-black">{item.titulo}</h2>

      <p className="mt-3 text-sm text-white/65">
        {item.descripcion || "Sin descripción"}
      </p>

      <div className="mt-5 rounded-xl border border-cyan-400/20 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-200">
        Visible hasta: {formatDate(item.fecha_fin_publicacion)}
      </div>

      <button
        className="mt-5 w-full rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-bold text-black hover:bg-cyan-300"
        onClick={() => {
          alert("Aquí luego va el detalle + ranking")
        }}
      >
        Ver competencia
      </button>
    </div>
  )
}

function formatDate(dateString) {
  if (!dateString) return "-"
  return new Date(dateString).toLocaleDateString("es-EC", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}