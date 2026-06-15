export default function DatosAtletaCard({
  usuario,
  form,
  saving,
  analyzing,
  onChange,
  onSave,
}) {
  return (
    <article className="nutri-card">
      <div className="nutri-card-head">
        <span>Datos del atleta</span>
      </div>

      <div className="nutri-user-row">
        <div>
          <h2>{usuario?.nombre || "Atleta PHO3NIX"}</h2>
          <p>
            {usuario?.edad ? `${usuario.edad} años` : "Edad no registrada"}
            {usuario?.sexo ? ` · ${usuario.sexo}` : ""}
          </p>
        </div>

        <div className="nutri-avatar">
          {usuario?.foto_url ? (
            <img src={usuario.foto_url} alt={usuario?.nombre || "Atleta"} />
          ) : (
            <span>{usuario?.nombre?.charAt(0) || "P"}</span>
          )}
        </div>
      </div>

      <div className="nutri-form-grid">
        <label>
          Peso actual
          <div className="nutri-input-wrap">
            <input
              type="number"
              value={form.peso_kg}
              onChange={(e) => onChange("peso_kg", e.target.value)}
              placeholder="Ej: 98.5"
            />
            <span>kg</span>
          </div>
        </label>

        <label>
          Estatura
          <div className="nutri-input-wrap">
            <input
              type="number"
              value={form.estatura_cm}
              onChange={(e) => onChange("estatura_cm", e.target.value)}
              placeholder="Ej: 170"
            />
            <span>cm</span>
          </div>
        </label>
      </div>

      <button
        type="button"
        className="nutri-secondary-btn"
        onClick={onSave}
        disabled={saving || analyzing}
      >
        {saving ? "Guardando..." : "Guardar datos"}
      </button>
    </article>
  )
}
