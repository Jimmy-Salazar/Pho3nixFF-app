import { useMemo, useState } from "react";
import StatusBadge from "./StatusBadge";
import { CATEGORIES, getCategoryLabel } from "../utils/constants";

const defaultForm = {
  nombre: "",
  cedula: "",
  telefono: "",
  categoria: "masculino_principiante",
  estado: "inscrito",
};

export default function CompetitorManager({
  competitors,
  saving,
  onSave,
  onDelete,
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(defaultForm);

  const grouped = useMemo(() => {
    return CATEGORIES.reduce((acc, category) => {
      acc[category.value] = competitors.filter(
        (competitor) => competitor.categoria === category.value
      );
      return acc;
    }, {});
  }, [competitors]);

  const openNew = (category = "masculino_principiante") => {
    setEditing(null);
    setForm({ ...defaultForm, categoria: category });
    setOpen(true);
  };

  const openEdit = (competitor) => {
    setEditing(competitor);
    setForm({
      nombre: competitor.nombre || "",
      cedula: competitor.cedula || "",
      telefono: competitor.telefono || "",
      categoria: competitor.categoria || "masculino_principiante",
      estado: competitor.estado || "inscrito",
    });
    setOpen(true);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.nombre.trim()) return;

    await onSave(form, editing?.id || null);

    setOpen(false);
    setEditing(null);
    setForm(defaultForm);
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black uppercase">Competidores</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Registra atletas por categoría y nivel.
          </p>
        </div>

        <button
          type="button"
          onClick={() => openNew()}
          className="rounded-2xl bg-orange-600 px-4 py-3 text-sm font-black uppercase text-black hover:bg-orange-500"
        >
          + Agregar competidor
        </button>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {CATEGORIES.map((category) => (
          <section
            key={category.value}
            className="rounded-3xl border border-white/10 bg-black/30 p-4"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-lg font-black uppercase text-orange-500">
                {category.label}
              </h3>

              <button
                type="button"
                onClick={() => openNew(category.value)}
                className="rounded-xl border border-orange-500/30 px-3 py-2 text-xs font-bold uppercase text-orange-400 hover:bg-orange-500/10"
              >
                + Atleta
              </button>
            </div>

            <div className="space-y-3">
              {grouped[category.value]?.length === 0 && (
                <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-zinc-500">
                  No hay competidores en esta categoría.
                </div>
              )}

              {grouped[category.value]?.map((competitor) => (
                <article
                  key={competitor.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-black uppercase">{competitor.nombre}</h4>
                      <p className="mt-1 text-sm text-zinc-500">
                        {competitor.cedula || "Sin cédula"} ·{" "}
                        {competitor.telefono || "Sin teléfono"}
                      </p>
                    </div>

                    <StatusBadge status={competitor.estado} compact />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(competitor)}
                      className="rounded-xl border border-white/10 px-3 py-2 text-xs font-bold uppercase text-zinc-300 hover:border-orange-500/40 hover:text-orange-400"
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      onClick={() => onDelete(competitor.id)}
                      className="rounded-xl border border-red-500/30 px-3 py-2 text-xs font-bold uppercase text-red-300 hover:bg-red-500/10"
                    >
                      Eliminar
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-2xl rounded-[2rem] border border-orange-500/20 bg-zinc-950 p-5 shadow-2xl shadow-orange-950/30"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-orange-500">
                  Atleta Challenge
                </p>
                <h2 className="mt-2 text-2xl font-black uppercase">
                  {editing ? "Editar competidor" : "Nuevo competidor"}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl border border-white/10 px-3 py-2 text-sm text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field label="Nombre">
                  <input
                    name="nombre"
                    value={form.nombre}
                    onChange={handleChange}
                    className="input-dark"
                    placeholder="Nombre del competidor"
                    required
                  />
                </Field>
              </div>

              <Field label="Cédula">
                <input
                  name="cedula"
                  value={form.cedula}
                  onChange={handleChange}
                  className="input-dark"
                  placeholder="Opcional"
                />
              </Field>

              <Field label="Teléfono">
                <input
                  name="telefono"
                  value={form.telefono}
                  onChange={handleChange}
                  className="input-dark"
                  placeholder="Opcional"
                />
              </Field>

              <Field label="Categoría">
                <select
                  name="categoria"
                  value={form.categoria}
                  onChange={handleChange}
                  className="input-dark"
                >
                  {CATEGORIES.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Estado">
                <select
                  name="estado"
                  value={form.estado}
                  onChange={handleChange}
                  className="input-dark"
                >
                  <option value="inscrito">Inscrito</option>
                  <option value="retirado">Retirado</option>
                </select>
              </Field>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl border border-white/10 px-5 py-3 text-sm font-bold text-zinc-300 hover:border-white/30"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-orange-600 px-5 py-3 text-sm font-black uppercase text-black hover:bg-orange-500 disabled:opacity-50"
              >
                {saving ? "Guardando..." : "Guardar atleta"}
              </button>
            </div>
          </form>
        </div>
      )}

      <style>{`
        .input-dark {
          width: 100%;
          border-radius: 0.9rem;
          border: 1px solid rgba(255,255,255,0.10);
          background: rgba(0,0,0,0.35);
          padding: 0.75rem 0.9rem;
          color: white;
          outline: none;
        }

        .input-dark:focus {
          border-color: rgba(249,115,22,0.65);
          box-shadow: 0 0 0 3px rgba(249,115,22,0.12);
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
        {label}
      </span>
      {children}
    </label>
  );
}