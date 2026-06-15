function formatoFecha(fecha) {
  if (!fecha) return "Sin fecha"

  return new Intl.DateTimeFormat("es-EC", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(`${fecha}T00:00:00`))
}

export default function AnalisisMensualCard({
  ultimoAnalisis,
  puedeAnalizar,
  diasParaAnalizar,
  proximoAnalisis,
  analyzing,
  saving,
  onAnalizar,
}) {
  const disabled = !puedeAnalizar || analyzing || saving

  return (
    <article className="nutri-card nutri-analysis-box">
      <div className="nutri-card-head">
        <span>Análisis mensual</span>
      </div>

      <p>
        Último análisis:{" "}
        <strong>
          {ultimoAnalisis?.fecha_analisis
            ? formatoFecha(ultimoAnalisis.fecha_analisis)
            : "Todavía no generado"}
        </strong>
      </p>

      <p>
        Próximo análisis:{" "}
        <strong>
          {proximoAnalisis ? formatoFecha(proximoAnalisis) : "Disponible ahora"}
        </strong>
      </p>

      {!puedeAnalizar && (
        <div className="nutri-lock">
          Faltan <strong>{diasParaAnalizar}</strong> días para generar un nuevo
          análisis.
        </div>
      )}

      <button
        type="button"
        className="nutri-primary-btn"
        disabled={disabled}
        onClick={onAnalizar}
      >
        {analyzing ? "Analizando con IA..." : "Analizar con IA"}
      </button>

      <p className="nutri-note">
        El análisis se genera cada 30 días para medir evolución real y evitar
        recomendaciones contradictorias.
      </p>
    </article>
  )
}
