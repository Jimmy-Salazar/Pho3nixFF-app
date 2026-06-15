function numero(valor) {
  if (valor === null || valor === undefined || valor === "") return 0
  const n = Number(valor)
  if (Number.isNaN(n)) return 0
  return n
}

export default function Resumen30DiasCard({ resumenWods, resumenPrs }) {
  const wods = numero(resumenWods?.wods30Dias)
  const calorias = numero(resumenWods?.calorias30Dias)
  const dias = numero(resumenWods?.diasEntrenados30Dias)
  const prs = numero(resumenPrs?.prs30Dias)

  return (
    <article className="nutri-card">
      <div className="nutri-card-head">
        <span>Resumen últimos 30 días</span>
      </div>

      <div className="nutri-stats">
        <div>
          <strong>{wods}</strong>
          <span>WODs</span>
        </div>

        <div>
          <strong>{calorias}</strong>
          <span>Calorías</span>
        </div>

        <div>
          <strong>{dias}</strong>
          <span>Días entrenados</span>
        </div>

        <div>
          <strong>{prs}</strong>
          <span>PRs</span>
        </div>
      </div>

      <div className="nutri-mini-info">
        <p>
          Modalidad más frecuente:{" "}
          <strong>{resumenWods?.mejorModalidad || "Sin datos"}</strong>
        </p>
        <p>
          Promedio por WOD:{" "}
          <strong>{resumenWods?.promedioCalorias || 0} kcal</strong>
        </p>
      </div>
    </article>
  )
}
