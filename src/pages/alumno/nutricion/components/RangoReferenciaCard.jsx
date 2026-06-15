function numero(valor, decimales = 1) {
  if (valor === null || valor === undefined || valor === "") return "--"
  const n = Number(valor)
  if (Number.isNaN(n)) return "--"
  return n.toFixed(decimales)
}

function textoDiferencia(valor) {
  if (valor === null || valor === undefined) return "--"
  if (Number(valor) === 0) return "Dentro del rango"
  if (Number(valor) > 0) return `+${numero(valor)} kg`
  return `${numero(valor)} kg`
}

export default function RangoReferenciaCard({ referencia }) {
  const tieneDatos = Boolean(
    referencia?.imc && referencia?.pesoMin && referencia?.pesoMax
  )

  return (
    <article className="nutri-card">
      <div className="nutri-card-head">
        <span>Rango saludable de referencia</span>
      </div>

      {!tieneDatos ? (
        <div className="nutri-empty nutri-reference-empty">
          <strong>Completa tus datos</strong>
          <p>
            Ingresa tu peso y estatura para calcular tu IMC y rango saludable de
            referencia.
          </p>
        </div>
      ) : (
        <>
          <div className="nutri-reference-main">
            <strong>
              {numero(referencia.pesoMin)} - {numero(referencia.pesoMax)} kg
            </strong>
            <p>Calculado según la estatura registrada</p>
          </div>

          <div className="nutri-reference-list">
            <div>
              <span>IMC actual</span>
              <strong>{numero(referencia.imc)}</strong>
            </div>

            <div>
              <span>Diferencia</span>
              <strong>{textoDiferencia(referencia.diferenciaRango)}</strong>
            </div>
          </div>

          <p className="nutri-note">
            Este rango es una referencia general. En atletas de fuerza o
            CrossFit, el peso debe analizarse junto con rendimiento, masa
            muscular, asistencia y evolución mensual.
          </p>
        </>
      )}
    </article>
  )
}
