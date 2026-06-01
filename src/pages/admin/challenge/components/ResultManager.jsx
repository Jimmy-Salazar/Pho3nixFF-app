import { useMemo, useState } from "react";
import {
  getCategoryLabel,
  getLevelFromCategory,
} from "../utils/constants";

const defaultForm = {
  competidor_id: "",
  wod_id: "",
  repeticiones: "",
  juez: "",
  evidencia_url: "",
  notas: "",
};

export default function ResultManager({
  wods,
  competitors,
  results,
  saving,
  onSave,
  onDelete,
}) {
  const [form, setForm] = useState(defaultForm);
  const [editing, setEditing] = useState(null);

  const selectedCompetitor = useMemo(() => {
    return competitors.find((item) => item.id === form.competidor_id) || null;
  }, [competitors, form.competidor_id]);

  const availableWods = useMemo(() => {
    if (!selectedCompetitor) return wods;

    const level = getLevelFromCategory(selectedCompetitor.categoria);

    return wods.filter((wod) => wod.nivel === level);
  }, [wods, selectedCompetitor]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => {
      if (name === "competidor_id") {
        return {
          ...current,
          competidor_id: value,
          wod_id: "",
        };
      }

      return {
        ...current,
        [name]: value,
      };
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.competidor_id || !form.wod_id) return;

    await onSave(
      {
        ...form,
        repeticiones: Number(form.repeticiones || 0),
      },
      editing?.id || null
    );

    setForm(defaultForm);
    setEditing(null);
  };

  const openEdit = (result) => {
    setEditing(result);
    setForm({
      competidor_id: result.competidor_id || "",
      wod_id: result.wod_id || "",
      repeticiones: result.repeticiones || "",
      juez: result.juez || "",
      evidencia_url: result.evidencia_url || "",
      notas: result.notas || "",
    });
  };

  const cancelEdit = () => {
    setEditing(null);
    setForm(defaultForm);
  };

  const getCompetitorName = (result) => {
    return (
      result.competidores?.nombre ||
      competitors.find((item) => item.id === result.competidor_id)?.nombre ||
      "Competidor"
    );
  };

  const getWodName = (result) => {
    const wod =
      result.competencia_wods ||
      wods.find((item) => item.id === result.wod_id);

    if (!wod) return "WOD";

    return `WOD ${wod.orden || ""} · ${wod.nombre}`;
  };

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-2xl font-black uppercase">Resultados</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Registra el score de cada atleta según su WOD correspondiente.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mb-6 rounded-3xl border border-orange-500/20 bg-black/30 p-4"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-lg font-black uppercase text-orange-500">
            {editing ? "Editando resultado" : "Nuevo resultado"}
          </h3>

          {editing && (
            <button
              type="button"
              onClick={cancelEdit}
              className="rounded-xl border border-white/10 px-3 py-2 text-xs font-bold uppercase text-zinc-300 hover:border-white/30"
            >
              Cancelar edición
            </button>
          )}
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Field label="Competidor">
            <select
              name="competidor_id"
              value={form.competidor_id}
              onChange={handleChange}
              className="input-dark"
              required
            >
              <option value="">Seleccionar</option>
              {competitors.map((competitor) => (
                <option key={competitor.id} value={competitor.id}>
                  {competitor.nombre} · {getCategoryLabel(competitor.categoria)}
                </option>
              ))}
            </select>
          </Field>

          <Field label="WOD">
            <select
              name="wod_id"
              value={form.wod_id}
              onChange={handleChange}
              className="input-dark"
              required
            >
              <option value="">Seleccionar</option>
              {availableWods.map((wod) => (
                <option key={wod.id} value={wod.id}>
                  WOD {wod.orden} · {wod.nombre} · {wod.nivel}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Repeticiones">
            <input
              name="repeticiones"
              type="number"
              min="0"
              value={form.repeticiones}
              onChange={handleChange}
              className="input-dark"
              placeholder="0"
              required
            />
          </Field>

          <Field label="Juez">
            <input
              name="juez"
              value={form.juez}
              onChange={handleChange}
              className="input-dark"
              placeholder="Nombre del juez"
            />
          </Field>

          <Field label="URL evidencia">
            <input
              name="evidencia_url"
              value={form.evidencia_url}
              onChange={handleChange}
              className="input-dark"
              placeholder="https://..."
            />
          </Field>

          <Field label="Notas">
            <input
              name="notas"
              value={form.notas}
              onChange={handleChange}
              className="input-dark"
              placeholder="Observación opcional"
            />
          </Field>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-orange-600 px-5 py-3 text-sm font-black uppercase text-black hover:bg-orange-500 disabled:opacity-50"
          >
            {saving ? "Guardando..." : editing ? "Actualizar" : "Guardar resultado"}
          </button>
        </div>
      </form>

      <section className="rounded-3xl border border-white/10 bg-black/30 p-4">
        <h3 className="mb-4 text-lg font-black uppercase">Resultados cargados</h3>

        <div className="space-y-3">
          {results.length === 0 && (
            <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-zinc-500">
              Todavía no hay resultados registrados.
            </div>
          )}

          {results.map((result) => (
            <article
              key={result.id}
              className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 lg:grid-cols-[1fr_1fr_auto]"
            >
              <div>
                <h4 className="font-black uppercase">
                  {getCompetitorName(result)}
                </h4>
                <p className="mt-1 text-sm text-zinc-500">
                  {getWodName(result)}
                </p>
              </div>

              <div>
                <p className="text-2xl font-black text-orange-500">
                  {result.repeticiones} reps
                </p>
                <p className="text-sm text-zinc-500">
                  Juez: {result.juez || "Sin juez"}
                </p>
              </div>

              <div className="flex items-center gap-2 lg:justify-end">
                <button
                  type="button"
                  onClick={() => openEdit(result)}
                  className="rounded-xl border border-white/10 px-3 py-2 text-xs font-bold uppercase text-zinc-300 hover:border-orange-500/40 hover:text-orange-400"
                >
                  Editar
                </button>

                <button
                  type="button"
                  onClick={() => onDelete(result.id)}
                  className="rounded-xl border border-red-500/30 px-3 py-2 text-xs font-bold uppercase text-red-300 hover:bg-red-500/10"
                >
                  Eliminar
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

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