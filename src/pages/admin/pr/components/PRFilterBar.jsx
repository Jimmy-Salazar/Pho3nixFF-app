// src/pages/admin/pr/components/PRFilterBar.jsx

const PR_TYPES = ["todos", "1RM"]

export default function PRFilterBar({
  search,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  exerciseFilter,
  onExerciseFilterChange,
  ejercicios,
}) {
  return (
    <section className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_190px_230px]">
      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/35">
          🔍
        </span>

        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar ejercicio o atleta..."
          className="phoenix-input pl-11"
        />
      </div>

      <select
        value={typeFilter}
        onChange={(e) => onTypeFilterChange(e.target.value)}
        className="phoenix-input"
      >
        {PR_TYPES.map((type) => (
          <option key={type} value={type} className="bg-black text-white">
            {type === "todos" ? "Tipo: Todos" : type}
          </option>
        ))}
      </select>

      <select
        value={exerciseFilter || "todos"}
        onChange={(e) => onExerciseFilterChange(e.target.value)}
        className="phoenix-input"
      >
        <option value="todos" className="bg-black text-white">
          Todos los ejercicios
        </option>

        {ejercicios.map((ejercicio) => (
          <option key={ejercicio.id} value={ejercicio.id} className="bg-black text-white">
            {ejercicio.nombre}
          </option>
        ))}
      </select>
    </section>
  )
}
