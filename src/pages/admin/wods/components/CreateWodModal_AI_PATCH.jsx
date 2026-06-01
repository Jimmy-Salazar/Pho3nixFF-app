// Fragmento para src/pages/admin/wods/components/CreateWodModal.jsx
// 1) Cambia el import:
// import { estimateWodWithAi } from "../services/estimateWodWithAi"
//
// 2) Agrega estos states:
// const [aiLoading, setAiLoading] = useState(false)
// const [aiError, setAiError] = useState("")
//
// 3) Agrega esta función dentro del componente:

async function handleAiEstimate() {
  if (!descripcion.trim()) {
    alert("Primero escribe la descripción del WOD.")
    return
  }

  try {
    setAiLoading(true)
    setAiError("")

    const result = await estimateWodWithAi({
      nombre,
      descripcion,
      modalidad,
      modoRanking,
    })

    setEstimateOverride(result)
  } catch (error) {
    setAiError(error?.message || "No se pudo estimar con IA.")
  } finally {
    setAiLoading(false)
  }
}

// 4) Para usar estimateOverride, cambia:
// const estimate = useMemo(() => estimateWodCalories(...), [...])
//
// por:
// const localEstimate = useMemo(() => estimateWodCalories({ nombre, descripcion, modoRanking, modalidad }), [nombre, descripcion, modoRanking, modalidad])
// const [estimateOverride, setEstimateOverride] = useState(null)
// const estimate = estimateOverride || localEstimate
//
// 5) En el panel/botones coloca un botón:
// <button type="button" onClick={handleAiEstimate} disabled={aiLoading} className="phoenix-button-ghost text-sm">
//   {aiLoading ? "Analizando con IA..." : "Analizar con IA"}
// </button>
