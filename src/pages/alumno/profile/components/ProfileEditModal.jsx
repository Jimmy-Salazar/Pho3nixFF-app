import { useEffect, useState } from "react"

export default function ProfileEditModal({ profile, saving, onClose, onSave }) {
  const [form, setForm] = useState({
    nombre: "",
    telefono: "",
    cedula: "",
    fecha_nacimiento: "",
  })

  useEffect(() => {
    setForm({
      nombre: profile?.nombre || "",
      telefono: profile?.telefono || "",
      cedula: profile?.cedula || "",
      fecha_nacimiento: profile?.fecha_nacimiento || "",
    })
  }, [profile])

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    onSave(form)
  }

  return (
    <div className="fixed inset-0 z-[160]">
      <button
        type="button"
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Cerrar"
      />

      <form
        onSubmit={handleSubmit}
        className="absolute left-1/2 top-1/2 w-[94vw] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[2rem] border border-white/10 bg-[#080808] shadow-2xl"
      >
        <div className="border-b border-orange-500/15 bg-gradient-to-br from-orange-500/10 via-white/[0.03] to-black p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-400">
                Perfil PHO3NIX
              </p>

              <h2 className="mt-2 text-2xl font-black uppercase text-white">
                Editar información
              </h2>

              <p className="mt-1 text-sm text-white/50">
                Actualiza tus datos personales básicos.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-black/40 text-xl text-white/60 transition hover:border-orange-400/40 hover:text-orange-300"
            >
              ×
            </button>
          </div>
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <Field label="Nombre completo">
            <input
              type="text"
              value={form.nombre}
              onChange={(event) => updateField("nombre", event.target.value)}
              className="phoenix-input"
              placeholder="Nombre completo"
            />
          </Field>

          <Field label="Teléfono">
            <input
              type="text"
              value={form.telefono}
              onChange={(event) => updateField("telefono", event.target.value)}
              className="phoenix-input"
              placeholder="099 123 4567"
            />
          </Field>

          <Field label="Cédula">
            <input
              type="text"
              value={form.cedula}
              onChange={(event) => updateField("cedula", event.target.value)}
              className="phoenix-input"
              placeholder="Número de cédula"
            />
          </Field>

          <Field label="Fecha de nacimiento">
            <input
              type="date"
              value={form.fecha_nacimiento || ""}
              onChange={(event) => updateField("fecha_nacimiento", event.target.value)}
              className="phoenix-input"
            />
          </Field>

          <div className="sm:col-span-2 rounded-2xl border border-orange-500/15 bg-orange-500/10 p-4 text-sm text-orange-100/75">
            Tu correo y estado de membresía son gestionados por PHO3NIX.
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-orange-500/15 p-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-black uppercase text-white/65 transition hover:border-white/20 hover:text-white disabled:opacity-50"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={saving}
            className="rounded-2xl bg-orange-500 px-5 py-3 text-sm font-black uppercase text-black transition hover:bg-orange-400 disabled:opacity-60"
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </form>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-white/45">
        {label}
      </span>
      {children}
    </label>
  )
}
