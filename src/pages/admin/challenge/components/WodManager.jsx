import { useMemo, useState } from "react";
import StatusBadge from "./StatusBadge";
import { SCORE_TYPES, WOD_LEVELS, WOD_STATUS } from "../utils/constants";

const defaultForm = {
  orden: "",
  nombre: "",
  nivel: "principiante",
  descripcion: "",
  time_cap: "",
  scoring: "reps",
  estado: "borrador",
};

export default function WodManager({ wods, saving, onSave, onDelete }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(defaultForm);

  const grouped = useMemo(() => {
    return WOD_LEVELS.reduce((acc, level) => {
      acc[level.value] = wods.filter((wod) => wod.nivel === level.value);
      return acc;
    }, {});
  }, [wods]);

  const openNew = (level = "principiante") => {
    setEditing(null);
    setForm({ ...defaultForm, nivel: level });
    setOpen(true);
  };

  const openEdit = (wod) => {
    setEditing(wod);
    setForm({
      orden: wod.orden || "",
      nombre: wod.nombre || "",
      nivel: wod.nivel || "principiante",
      descripcion: wod.descripcion || "",
      time_cap: wod.time_cap || "",
      scoring: wod.scoring || "reps",
      estado: wod.estado || "borrador",
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

    await onSave(
      {
        ...form,
        orden: Number(form.orden || 1),
      },
      editing?.id || null
    );

    setOpen(false);
    setEditing(null);
    setForm(defaultForm);
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black uppercase">WODs del Challenge</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Separa los WODs por nivel: Principiante y Avanzado.
          </p>
        </div>

        <button
          type="button"
          onClick={() => openNew()}
          className="rounded-2xl bg-orange-600 px-4 py-3 text-sm font-black uppercase text-black hover:bg-orange-500"
        >
          + Agregar WOD
        </button>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {WOD_LEVELS.map((level) => (
          <section
            key={level.value}
            className="rounded-3xl border border-white/10 bg-black/30 p-4"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-black uppercase text-orange-500">
                {level.label}
              </h3>

              <button
                type="button"
                onClick={() => openNew(level.value)}
                className="rounded-xl border border-orange-500/30 px-3 py-2 text-xs font-bold uppercase text-orange-400 hover:bg-orange-500/10"
              >
                + WOD
              </button>
            </div>

            <div className="space-y-3">
              {grouped[level.value]?.length === 0 && (
                <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-zinc-500">
                  No hay WODs para este nivel.
                </div>
              )}

              {grouped[level.value]?.map((wod) => (
                <article
                  key={wod.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase text-orange-500">
                        WOD {wod.orden}
                      </p>
                      <h4 className="mt-1 text-lg font-black uppercase">
                        {wod.nombre}
                      </h4>
                      <p className="mt-1 text-sm text-zinc-400">
                        {wod.time_cap || "Sin time cap"} ·{" "}
                        {wod.scoring === "time"
                          ? "Menor tiempo"
                          : "Máximas repeticiones"}
                      </p>
                    </div>

                    <StatusBadge status={wod.estado} compact />
                  </div>

                  {wod.descripcion && (
                    <p className="mt-3 whitespace-pre-line text-sm leading-6 text-zinc-300">
                      {wod.descripcion}
                    </p>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(wod)}
                      className="rounded-xl border border-white/10 px-3 py-2 text-xs font-bold uppercase text-zinc-300 hover:border-orange-500/40 hover:text-orange-400"
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      onClick={() => onDelete(wod.id)}
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
                  WOD Challenge
                </p>
                <h2 className="mt-2 text-2xl font-black uppercase">
                  {editing ? "Editar WOD" : "Nuevo WOD"}
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
              <Field label="Orden">
                <input
                  name="orden"
                  type="number"
                  min="1"
                  value={form.orden}
                  onChange={handleChange}
                  className="input-dark"
                  placeholder="1"
                />
              </Field>

              <Field label="Nivel">
                <select
                  name="nivel"
                  value={form.nivel}
                  onChange={handleChange}
                  className="input-dark"
                >
                  {WOD_LEVELS.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </Field>

              <div className="sm:col-span-2">
                <Field label="Nombre">
                  <input
                    name="nombre"
                    value={form.nombre}
                    onChange={handleChange}
                    className="input-dark"
                    placeholder="For Time / Chipper / Max Reps"
                    required
                  />
                </Field>
              </div>

              <Field label="Time cap">
                <input
                  name="time_cap"
                  value={form.time_cap}
                  onChange={handleChange}
                  className="input-dark"
                  placeholder="AMRAP 15' / 12 min / For time"
                />
              </Field>

              <Field label="Tipo de score">
                <select
                  name="scoring"
                  value={form.scoring}
                  onChange={handleChange}
                  className="input-dark"
                >
                  {SCORE_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
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
                  {WOD_STATUS.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </Field>

              <div className="sm:col-span-2">
                <Field label="Descripción">
                  <textarea
                    name="descripcion"
                    value={form.descripcion}
                    onChange={handleChange}
                    className="input-dark min-h-32 resize-none"
                    placeholder="Detalle del WOD..."
                  />
                </Field>
              </div>
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
                {saving ? "Guardando..." : "Guardar WOD"}
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