// src/pages/admin/anuncios/AnunciosPage.jsx

import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import DashboardSidebar from "../dashboard/components/DashboardSidebar"
import AnunciosHeader from "./components/AnunciosHeader"
import AnunciosStats from "./components/AnunciosStats"
import AnunciosFilters from "./components/AnunciosFilters"
import AnunciosList from "./components/AnunciosList"
import CreateAnuncioModal from "./components/CreateAnuncioModal"
import AdminAnunciosMobile from "./mobile/AdminAnunciosMobile"
import {
  createAnuncio,
  deleteAnuncio,
  fetchAnuncios,
  updateAnuncio,
} from "./services/anunciosService"
import { getAnuncioStatus } from "./utils/anunciosUtils"

export default function AnunciosPage() {
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [anuncios, setAnuncios] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editingAnuncio, setEditingAnuncio] = useState(null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("todos")

  useEffect(() => {
    loadAnuncios()
  }, [])

  async function loadAnuncios() {
    try {
      setLoading(true)
      setError("")

      const rows = await fetchAnuncios()
      setAnuncios(rows)
    } catch (e) {
      setError(e?.message || "No se pudieron cargar los anuncios.")
    } finally {
      setLoading(false)
    }
  }

  const stats = useMemo(() => {
    return {
      total: anuncios.length,
      activos: anuncios.filter((a) => getAnuncioStatus(a) === "activo").length,
      programados: anuncios.filter((a) => getAnuncioStatus(a) === "programado")
        .length,
      inactivos: anuncios.filter((a) => getAnuncioStatus(a) === "inactivo")
        .length,
    }
  }, [anuncios])

  const filteredAnuncios = useMemo(() => {
    const term = search.trim().toLowerCase()

    return anuncios.filter((anuncio) => {
      const status = getAnuncioStatus(anuncio)
      const matchesStatus = statusFilter === "todos" || status === statusFilter

      const matchesSearch =
        !term ||
        String(anuncio.titulo || "").toLowerCase().includes(term) ||
        String(anuncio.contenido || "").toLowerCase().includes(term)

      return matchesStatus && matchesSearch
    })
  }, [anuncios, search, statusFilter])

  function openCreateModal() {
    setEditingAnuncio(null)
    setModalOpen(true)
  }

  function openEditModal(anuncio) {
    setEditingAnuncio(anuncio)
    setModalOpen(true)
  }

  function closeModal() {
    if (saving) return

    setEditingAnuncio(null)
    setModalOpen(false)
  }

  async function handleSave(payload) {
    try {
      setSaving(true)

      if (editingAnuncio?.id) {
        await updateAnuncio(editingAnuncio.id, payload)
      } else {
        await createAnuncio(payload)
      }

      await loadAnuncios()
      closeModal()
    } catch (e) {
      alert(e?.message || "No se pudo guardar el anuncio.")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(anuncio) {
    const ok = window.confirm(`¿Eliminar el anuncio "${anuncio.titulo}"?`)
    if (!ok) return

    try {
      await deleteAnuncio(anuncio.id)
      await loadAnuncios()
    } catch (e) {
      alert(e?.message || "No se pudo eliminar el anuncio.")
    }
  }

  return (
    <div className="fixed inset-0 z-[80] overflow-hidden bg-black text-white">
      {/* DESKTOP ORIGINAL */}
      <div className="hidden h-full overflow-hidden lg:block">
        <div className="grid h-full grid-cols-[270px_1fr] overflow-hidden">
          <DashboardSidebar navigate={navigate} />

          <main className="phoenix-page min-w-0 overflow-hidden p-5">
            <div className="grid h-full grid-rows-[auto_auto_auto_1fr] gap-4 overflow-hidden">
              <AnunciosHeader onCreate={openCreateModal} />

              <AnunciosStats stats={stats} />

              <AnunciosFilters
                search={search}
                onSearchChange={setSearch}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
              />

              <AnunciosList
                loading={loading}
                error={error}
                anuncios={filteredAnuncios}
                onEdit={openEditModal}
                onDelete={handleDelete}
              />
            </div>
          </main>
        </div>
      </div>

      {/* MOBILE NUEVO */}
      <AdminAnunciosMobile
        loading={loading}
        error={error}
        anuncios={filteredAnuncios}
        stats={stats}
        search={search}
        statusFilter={statusFilter}
        onSearchChange={setSearch}
        onStatusFilterChange={setStatusFilter}
        onCreate={openCreateModal}
        onEdit={openEditModal}
        onDelete={handleDelete}
        navigate={navigate}
      />

      {modalOpen ? (
        <CreateAnuncioModal
          initialAnuncio={editingAnuncio}
          saving={saving}
          onClose={closeModal}
          onSave={handleSave}
        />
      ) : null}
    </div>
  )
}