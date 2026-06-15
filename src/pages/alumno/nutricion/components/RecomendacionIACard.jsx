const CAMPOS = [
  ["resumen", "Resumen"],
  ["diagnostico", "Diagnóstico"],
  ["nutricion", "Nutrición"],
  ["entrenamiento", "Entrenamiento"],
  ["pre_wod", "Pre-WOD"],
  ["post_wod", "Post-WOD"],
  ["hidratacion", "Hidratación"],
  ["descanso", "Descanso"],
]

export default function RecomendacionIACard({ analisis, meta, metasLabels }) {
  if (!analisis) {
    return (
      <section className="nutri-card nutri-ai-result">
        <div className="nutri-card-head">
          <span>Recomendación actual</span>
          <small>{metasLabels?.[meta] || "Meta actual"}</small>
        </div>

        <div className="nutri-empty">
          <strong>Aún no tienes análisis IA.</strong>
          <p>
            Guarda tus datos y presiona “Analizar con IA” para generar tu primer
            análisis nutricional y deportivo.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="nutri-card nutri-ai-result">
      <div className="nutri-card-head">
        <span>Recomendación actual</span>
        <small>{metasLabels?.[analisis.meta] || metasLabels?.[meta] || "Meta"}</small>
      </div>

      <div className="nutri-ai-grid">
        {CAMPOS.map(([key, label]) => (
          <div key={key}>
            <h3>{label}</h3>
            <p>{analisis?.[key] || "Sin información registrada."}</p>
          </div>
        ))}
      </div>

      <div className="nutri-alert">
        {analisis.alerta ||
          "Este análisis es orientativo y no reemplaza consulta médica o nutricional profesional."}
      </div>
    </section>
  )
}
