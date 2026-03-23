import { useEffect, useState } from "react"
import { supabase } from "../supabase"
import { useNavigate } from "react-router-dom"

export default function Ranking() {

  const [ejercicios, setEjercicios] = useState([])
  const [ranking, setRanking] = useState([])
  const [indice, setIndice] = useState(0)
  const [usuarioActual, setUsuarioActual] = useState(null)
  const [animar, setAnimar] = useState(false)
  const [esMovil, setEsMovil] = useState(window.innerWidth < 480)

  /* ================== RESPONSIVE ================== */

  useEffect(() => {
    const handleResize = () => {
      setEsMovil(window.innerWidth < 480)
    }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  /* ================== INICIAL ================== */

  useEffect(() => {
    obtenerUsuario()
    obtenerEjercicios()
  }, [])

  /* ================== AUTO ROTACIÓN ================== */

  useEffect(() => {
    if (ejercicios.length === 0) return

    const interval = setInterval(() => {
      setIndice(prev => (prev + 1) % ejercicios.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [ejercicios])

  /* ================== ANIMACIÓN + CARGA ================== */

  useEffect(() => {
    if (ejercicios.length === 0) return

    setAnimar(true)

    obtenerRanking(ejercicios[indice].id)

    const timeout = setTimeout(() => {
      setAnimar(false)
    }, 400)

    return () => clearTimeout(timeout)

  }, [indice, ejercicios])

  /* ================== DATA ================== */

  async function obtenerUsuario() {
    const { data } = await supabase.auth.getUser()
    if (data?.user) setUsuarioActual(data.user.id)
  }

  async function obtenerEjercicios() {
    const { data } = await supabase
      .from("ejercicios")
      .select("id, nombre")

    if (data) setEjercicios(data)
  }

  async function obtenerRanking(ejercicioId) {
    const { data } = await supabase
      .rpc("top5_por_ejercicio", { ejercicio_id_param: ejercicioId })

    if (data) setRanking(data)
  }

  if (ejercicios.length === 0)
    return <p style={{ textAlign: "center" }}>Cargando ranking...</p>

  const maxPeso = ranking[0]?.mejor_rm || 1

  return (
    <div style={containerStyle}>

      {/* ===== HEADER ===== */}
      <div style={headerStyle}>
        <div style={headerTopStyle}>
          <span style={trophyStyle}>🏆</span>
          <h2 style={titleStyle}>Ranking Global</h2>
        </div>

        <div style={subTitleStyle}>
          {ejercicios[indice]?.nombre}
        </div>

        <div style={dividerStyle}></div>
      </div>

      {/* ===== TABLA ===== */}
      <div
        style={{
          ...cardContainerStyle,
          opacity: animar ? 0 : 1,
          transform: animar ? "translateY(10px)" : "translateY(0px)"
        }}
      >

        {/* Cabecera */}
        <div
          style={{
            ...tableHeaderStyle,
            gridTemplateColumns: esMovil ? "40px 1fr 70px" : "60px 1fr 100px"
          }}
        >
          <div>No.</div>
          <div>Alumno</div>
          <div style={{ textAlign: "right" }}>Peso</div>
        </div>

        {ranking.length === 0 ? (
          <div style={mensajeStyle}>
            🚫 NO HAY REGISTROS
          </div>
        ) : (
          ranking.map((item, i) => {

            const esUsuarioActual = item.usuario_id === usuarioActual
            const porcentaje = (item.mejor_rm / maxPeso) * 100

            return (
              <div
                key={i}
                style={{
                  ...cardStyle,
                  gridTemplateColumns: esMovil ? "40px 1fr 70px" : "60px 1fr 100px",
                  backgroundColor: esUsuarioActual ? "#1e293b" : "#111",
                  border: esUsuarioActual
                    ? "2px solid #22c55e"
                    : "1px solid #333"
                }}
              >

                {/* Posición */}
                <div style={{ fontWeight: "bold" }}>
                  {i + 1}
                </div>

                {/* Nombre */}
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontWeight: "bold" }}>
                    {item.nombre}
                    {esUsuarioActual && " (TÚ)"}
                  </div>

                  {/* Barra */}
                  <div style={barraContainerStyle}>
                    <div
                      style={{
                        ...barraStyle,
                        width: `${porcentaje}%`
                      }}
                    />
                  </div>
                </div>

                {/* Peso */}
                <div style={{ textAlign: "right", fontWeight: "bold" }}>
                  {item.mejor_rm} lb
                </div>

              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

/* ================== ESTILOS ================== */

const containerStyle = {
  padding: "30px 15px",
  textAlign: "center",
  background: "#0f172a",
  minHeight: "100vh",
  color: "white"
}

const cardContainerStyle = {
  marginTop: "30px",
  display: "flex",
  flexDirection: "column",
  gap: "15px",
  maxWidth: "600px",
  width: "100%",
  marginLeft: "auto",
  marginRight: "auto",
  transition: "all 0.4s ease"
}

const cardStyle = {
  padding: "15px",
  borderRadius: "12px",
  display: "grid",
  alignItems: "center",
  boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
  transition: "all 0.3s ease"
}

const barraContainerStyle = {
  height: "6px",
  backgroundColor: "#1e293b",
  borderRadius: "4px",
  marginTop: "6px",
  overflow: "hidden"
}

const barraStyle = {
  height: "100%",
  background: "linear-gradient(to right, #22c55e, #3b82f6)",
  transition: "width 0.5s ease"
}

const mensajeStyle = {
  padding: "20px",
  borderRadius: "12px",
  backgroundColor: "#1e293b",
  border: "1px solid #334155"
}

const headerStyle = {
  marginBottom: "30px"
}

const headerTopStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "10px"
}

const trophyStyle = {
  fontSize: "28px"
}

const titleStyle = {
  margin: 0,
  fontSize: "28px",
  fontWeight: "bold"
}

const subTitleStyle = {
  marginTop: "8px",
  fontSize: "18px",
  color: "#94a3b8"
}

const dividerStyle = {
  marginTop: "15px",
  height: "2px",
  width: "80px",
  background: "linear-gradient(to right, #22c55e, #3b82f6)",
  marginLeft: "auto",
  marginRight: "auto",
  borderRadius: "2px"
}

const tableHeaderStyle = {
  display: "grid",
  padding: "10px 15px",
  fontWeight: "bold",
  color: "#94a3b8",
  borderBottom: "1px solid #334155",
  marginBottom: "10px"
}