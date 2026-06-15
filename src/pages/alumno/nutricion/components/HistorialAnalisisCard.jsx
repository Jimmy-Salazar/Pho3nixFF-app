function formatoFecha(fecha) {
  if (!fecha) return "Sin fecha"

  return new Intl.DateTimeFormat("es-EC", {
    month: "long",
    year: "numeric",
  }).format(new Date(`${fecha}T00:00:00`))
}

export default function HistorialAnalisisCard({ historial, metasLabels }) {
  return (
    <article className="nutri-card">
      <div className="nutri-card-head">
        <span>Historial</span>
      </div>

      {historial?.length ? (
        <div className="nutri-history">
          {historial.map((item) => (
            <button type="button" key={item.id}>
              <strong>{formatoFecha(item.fecha_analisis)}</strong>
              <span>
                {metasLabels?.[item.meta] || item.meta || "Meta"} · Score{" "}
                {item.score_pho3nix || "--"} · {item.peso_kg || "--"} kg
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="nutri-empty">
          <strong>No hay análisis guardados.</strong>
          <p>Cuando generes tu análisis mensual, aparecerá aquí.</p>
        </div>
      )}
    </article>
  )
}
