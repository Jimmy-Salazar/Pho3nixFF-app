import { CATEGORIES } from "./constants";

export function buildRanking({ competitors = [], results = [], wods = [] }) {
  const wodIds = new Set(wods.map((wod) => wod.id));

  const totalsByCompetitor = results.reduce((acc, result) => {
    if (!result.competidor_id) return acc;
    if (result.wod_id && !wodIds.has(result.wod_id)) return acc;

    const current = acc[result.competidor_id] || {
      total: 0,
      completedWods: 0,
      details: [],
    };

    const reps = Number(result.repeticiones || 0);

    current.total += reps;
    current.completedWods += 1;
    current.details.push({
      wod_id: result.wod_id,
      repeticiones: reps,
    });

    acc[result.competidor_id] = current;
    return acc;
  }, {});

  const ranking = {};

  CATEGORIES.forEach((category) => {
    const categoryCompetitors = competitors.filter(
      (competitor) =>
        competitor.categoria === category.value &&
        competitor.estado !== "retirado"
    );

    ranking[category.value] = categoryCompetitors
      .map((competitor) => {
        const totals = totalsByCompetitor[competitor.id] || {
          total: 0,
          completedWods: 0,
          details: [],
        };

        return {
          ...competitor,
          total: totals.total,
          completedWods: totals.completedWods,
          details: totals.details,
        };
      })
      .sort((a, b) => {
        if (b.total !== a.total) return b.total - a.total;
        return a.nombre.localeCompare(b.nombre);
      })
      .map((competitor, index) => ({
        ...competitor,
        position: index + 1,
      }));
  });

  return ranking;
}