import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { mensualidadStatusInfo } from "../../../utils/mensualidades"

import AlumnoSidebar from "../dashboard/components/AlumnoSidebar"
import AlumnoMobileNav from "../shared/AlumnoMobileNav"

import NutricionMobile from "./components/NutricionMobile"
import NutricionDesktop from "./components/NutricionDesktop"
import { getInitials } from "./components/NutricionUi"

import {
  cargarDashboardNutricion,
  crearAnalisisNutricion,
  guardarPerfilNutricional,
  nutricionUtils,
} from "./utils/nutricionService"

const FORM_INICIAL = {
  peso_kg: "",
  estatura_cm: "",
  meta: "perder_grasa",
}

export default function NutricionAlumno() {
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [dashboard, setDashboard] = useState(null)
  const [form, setForm] = useState(FORM_INICIAL)

  async function cargarDatos() {
    try {
      setLoading(true)
      setError("")
      setSuccess("")

      const data = await cargarDashboardNutricion()
      setDashboard(data)

      if (data?.perfil) {
        setForm({
          peso_kg: data.perfil.peso_kg || "",
          estatura_cm: data.perfil.estatura_cm || "",
          meta: data.perfil.meta || "perder_grasa",
        })
      }
    } catch (err) {
      console.error("ERROR NUTRICIÓN ALUMNO:", err)
      setError(err.message || "No se pudo cargar el módulo de Nutrición.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  const referenciaActual = useMemo(() => {
    const imc = nutricionUtils.calcularIMC(form.peso_kg, form.estatura_cm)
    const rango = nutricionUtils.calcularRangoSaludable(form.estatura_cm)
    const diferencia = nutricionUtils.calcularDiferenciaRango(form.peso_kg, rango)

    return {
      imc,
      pesoMin: rango?.min || null,
      pesoMax: rango?.max || null,
      diferenciaRango: diferencia,
    }
  }, [form.peso_kg, form.estatura_cm])

  const usuario = dashboard?.usuario || null
  const resumenWods = dashboard?.resumenWods || null
  const resumenPrs = dashboard?.resumenPrs || null
  const historial = dashboard?.historial || []
  const ultimoAnalisis = dashboard?.ultimoAnalisis || null
  const puedeAnalizar = dashboard?.puedeAnalizar || false
  const diasParaAnalizar = dashboard?.diasParaAnalizar || 0
  const proximoAnalisis = dashboard?.proximoAnalisis || null

  const profileName = usuario?.nombre || "Alumno PHO3NIX"
  const initials = getInitials(profileName)

  const hasReference =
    Number(form.peso_kg || 0) > 0 && Number(form.estatura_cm || 0) > 0

  const membership = useMemo(() => {
    return getMembershipLabel(dashboard?.mensualidad)
  }, [dashboard?.mensualidad])

  function actualizarCampo(campo, valor) {
    setForm((prev) => ({
      ...prev,
      [campo]: valor,
    }))
  }

  async function handleGuardarPerfil(payloadOverride = null) {
    try {
      setSaving(true)
      setError("")
      setSuccess("")

      if (!usuario?.id) {
        throw new Error("No se encontró el usuario.")
      }

      const payload = payloadOverride || form

      await guardarPerfilNutricional(usuario.id, payload)
      await cargarDatos()

      setSuccess("Perfil nutricional guardado correctamente.")
    } catch (err) {
      console.error("Error guardando perfil nutricional:", err)
      setError(err.message || "No se pudo guardar el perfil nutricional.")
    } finally {
      setSaving(false)
    }
  }

  async function handleAnalizar() {
    try {
      setAnalyzing(true)
      setError("")
      setSuccess("")

      if (!usuario?.id) {
        throw new Error("No se encontró el usuario.")
      }

      const perfilGuardado = await guardarPerfilNutricional(usuario.id, form)

      await crearAnalisisNutricion(usuario, perfilGuardado)
      await cargarDatos()

      setSuccess("Análisis IA generado correctamente.")
    } catch (err) {
      console.error("Error generando análisis nutricional:", err)
      setError(err.message || "No se pudo generar el análisis con IA.")
    } finally {
      setAnalyzing(false)
    }
  }

  const commonProps = {
    loading,
    usuario,
    initials,
    form,
    referencia: referenciaActual,
    hasReference,
    resumenWods,
    resumenPrs,
    historial,
    ultimoAnalisis,
    puedeAnalizar,
    diasParaAnalizar,
    proximoAnalisis,
    error,
    success,
    saving,
    analyzing,
    metasLabels: nutricionUtils.METAS_LABELS,
    onChange: actualizarCampo,
    onSave: handleGuardarPerfil,
    onAnalizar: handleAnalizar,
  }

  return (
    <div className="fixed inset-0 z-[70] w-screen max-w-full overflow-hidden bg-[#050505] text-white">
      <div className="lg:hidden">
        <NutricionMobile {...commonProps} />
      </div>

      <div className="hidden h-full w-full max-w-full grid-cols-[270px_minmax(0,1fr)] overflow-hidden lg:grid">
        <AlumnoSidebar navigate={navigate} membership={membership} />
        <NutricionDesktop {...commonProps} />
      </div>

      <AlumnoMobileNav />
    </div>
  )
}

function getMembershipLabel(mensualidad) {
  if (!mensualidad) {
    return {
      status: "vencida",
      title: "Sin membresía",
      subtitle: "Consulta con administración",
      progress: 15,
    }
  }

  const info = mensualidadStatusInfo(mensualidad, new Date())

  if (!info.active) {
    return {
      status: "vencida",
      title: "Vencida",
      subtitle: "Renueva tu mensualidad",
      progress: 15,
    }
  }

  if (info.daysLeft !== null && info.daysLeft <= 7) {
    return {
      status: "por_vencer",
      title: "Por vencer",
      subtitle:
        info.daysLeft === 0
          ? "Vence hoy"
          : `Vence en ${info.daysLeft} día(s)`,
      progress: 72,
    }
  }

  return {
    status: "activa",
    title: "Activa",
    subtitle:
      info.daysLeft !== null
        ? `Vence en ${info.daysLeft} día(s)`
        : "Mensualidad activa",
    progress: 92,
  }
}
