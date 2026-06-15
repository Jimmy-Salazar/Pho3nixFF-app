function prepararDatos(historial = []) {
  return [...historial]
    .reverse()
    .slice(-6)
    .map((item) => ({
      fecha: item.fecha_analisis,
      peso: Number(item.peso_kg || 0),
      score: Number(item.score_pho3nix || 0),
    }))
}

function puntosLinea(data = []) {
  if (data.length === 0) return ""

  const maxScore = 100
  const minScore = 0

  return data
    .map((item, index) => {
      const x = data.length === 1 ? 150 : 20 + index * (260 / (data.length - 1))
      const normalized = (item.score - minScore) / (maxScore - minScore)
      const y = 112 - normalized * 84
      return `${x},${y}`
    })
    .join(" ")
}

function etiquetaMes(fecha) {
  if (!fecha) return "--"

  return new Intl.DateTimeFormat("es-EC", {
    month: "short",
  })
    .format(new Date(`${fecha}T00:00:00`))
    .replace(".", "")
}

export default function EvolucionNutricionCard({ historial }) {
  const data = prepararDatos(historial)

  return (
    <article className="nutri-card">
      <div className="nutri-card-head">
        <span>Evolución PHO3NIX</span>
      </div>

      {data.length === 0 ? (
        <div className="nutri-empty">
          <strong>Sin evolución todavía.</strong>
          <p>Genera tu primer análisis para iniciar el gráfico mensual.</p>
        </div>
      ) : (
        <>
          <div className="nutri-chart">
            <svg viewBox="0 0 300 130" className="nutri-chart-svg">
              <polyline
                points={puntosLinea(data)}
                fill="none"
                stroke="currentColor"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {data.map((item, index) => {
                const x =
                  data.length === 1 ? 150 : 20 + index * (260 / (data.length - 1))
                const y = 112 - (item.score / 100) * 84

                return (
                  <g key={`${item.fecha}-${index}`}>
                    <circle cx={x} cy={y} r="6" fill="currentColor" />
                    <text
                      x={x}
                      y="124"
                      textAnchor="middle"
                      className="nutri-chart-label"
                    >
                      {etiquetaMes(item.fecha)}
                    </text>
                  </g>
                )
              })}
            </svg>
          </div>

          <div className="nutri-evolution-list">
            {data.map((item, index) => (
              <div key={`${item.fecha}-${index}`}>
                <span>{etiquetaMes(item.fecha)}</span>
                <strong>{item.peso || "--"} kg</strong>
                <small>{item.score || "--"}/100</small>
              </div>
            ))}
          </div>
        </>
      )}
    </article>
  )
}
