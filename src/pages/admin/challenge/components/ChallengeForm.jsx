import { useEffect, useState } from "react";
import { COMPETITION_STATUS } from "../utils/constants";

const defaultForm = {
  nombre: "",
  descripcion: "",
  fecha_inicio: "",
  fecha_fin: "",
  flyer_url: "",
  estado: "borrador",
};

export default function ChallengeForm({
  open,
  initialData,
  saving,
  onClose,
  onSave,
}) {
  const [form, setForm] = useState(defaultForm);

  useEffect(() => {
    if (!open) return;

    if (initialData) {
      setForm({
        nombre: initialData.nombre || "",
        descripcion: initialData.descripcion || "",
        fecha_inicio: initialData.fecha_inicio || "",
        fecha_fin: initialData.fecha_fin || "",
        flyer_url: initialData.flyer_url || "",
        estado: initialData.estado || "borrador",
      });
    } else {
      setForm(defaultForm);
    }
  }, [open, initialData]);

  if (!open) return null;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.nombre.trim()) return;

    await onSave(form, initialData?.id || null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-2xl rounded-[2rem] border border-orange-500/20 bg-zinc-950 p-5 shadow-2xl shadow-orange-950/30"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-orange-500">
              Challenge
            </p>
            <h2 className="mt-2 text-2xl font-black uppercase">
              {initialData ? "Editar competencia" : "Nueva competencia"}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 px-3 py-2 text-sm text-zinc-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field label="Nombre">
            <input
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              className="input-dark"
              placeholder="PHO3NIX 25.6"
              required
            />
          </Field>

          <Field label="Estado">
            <select
              name="estado"
              value={form.estado}
              onChange={handleChange}
              className="input-dark"
            >
              {COMPETITION_STATUS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Fecha inicio">
            <input
              type="date"
              name="fecha_inicio"
              value={form.fecha_inicio}
              onChange={handleChange}
              className="input-dark"
            />
          </Field>

          <Field label="Fecha fin">
            <input
              type="date"
              name="fecha_fin"
              value={form.fecha_fin}
              onChange={handleChange}
              className="input-dark"
            />
          </Field>

          <div className="sm:col-span-2">
            <Field label="URL del flyer">
              <input
                name="flyer_url"
                value={form.flyer_url}
                onChange={handleChange}
                className="input-dark"
                placeholder="https://..."
              />
            </Field>
          </div>

          <div className="sm:col-span-2">
            <Field label="Descripción">
              <textarea
                name="descripcion"
                value={form.descripcion}
                onChange={handleChange}
                className="input-dark min-h-28 resize-none"
                placeholder="Describe el challenge..."
              />
            </Field>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 px-5 py-3 text-sm font-bold text-zinc-300 hover:border-white/30"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-orange-600 px-5 py-3 text-sm font-black uppercase text-black hover:bg-orange-500 disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>

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
      </form>
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