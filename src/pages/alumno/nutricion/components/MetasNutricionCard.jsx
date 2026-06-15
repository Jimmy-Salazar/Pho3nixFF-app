const METAS = [
  {
    id: "perder_grasa",
    titulo: "Perder grasa",
    texto: "Reducir grasa corporal sin destruir tu rendimiento.",
  },
  {
    id: "recomposicion",
    titulo: "Mantener / recomposición",
    texto: "Bajar grasa y mejorar masa muscular progresivamente.",
  },
  {
    id: "ganar_masa_muscular",
    titulo: "Ganar masa muscular",
    texto: "Subir masa muscular cuidando fuerza y recuperación.",
  },
  {
    id: "mejorar_rendimiento",
    titulo: "Mejorar rendimiento deportivo",
    texto: "Rendir mejor en WODs, fuerza, resistencia y recuperación.",
  },
]

export default function MetasNutricionCard({ meta, onChange }) {
  return (
    <section className="nutri-card nutri-goals-card">
      <div className="nutri-card-head">
        <span>Selecciona tu meta</span>
      </div>

      <div className="nutri-goals">
        {METAS.map((item) => (
          <button
            type="button"
            key={item.id}
            className={`nutri-goal ${meta === item.id ? "active" : ""}`}
            onClick={() => onChange(item.id)}
          >
            <strong>{item.titulo}</strong>
            <span>{item.texto}</span>
          </button>
        ))}
      </div>
    </section>
  )
}
