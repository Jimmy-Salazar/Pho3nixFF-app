export default function NutricionHero({ score }) {
  return (
    <section className="nutri-hero">
      <div>
        <p className="nutri-eyebrow">PHO3NIX IA</p>
        <h1>Nutrición</h1>
        <p>
          Análisis nutricional y deportivo basado en tu objetivo, evolución,
          WODs, calorías, asistencia, PRs y rendimiento.
        </p>
      </div>

      <div className="nutri-score">
        <span>Score</span>
        <strong>{score || "--"}</strong>
        <small>/100</small>
      </div>
    </section>
  )
}
