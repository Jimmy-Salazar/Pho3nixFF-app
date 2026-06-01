export const COMPETITION_STATUS = [
  { value: "borrador", label: "Borrador" },
  { value: "activa", label: "Activa" },
  { value: "cerrada", label: "Cerrada" },
];

export const WOD_STATUS = [
  { value: "borrador", label: "Borrador" },
  { value: "abierto", label: "Abierto" },
  { value: "cerrado", label: "Cerrado" },
];

export const WOD_LEVELS = [
  { value: "principiante", label: "Principiante" },
  { value: "avanzado", label: "Avanzado" },
];

export const SCORE_TYPES = [
  { value: "reps", label: "Máximas repeticiones" },
  { value: "time", label: "Menor tiempo" },
];

export const CATEGORIES = [
  {
    value: "masculino_principiante",
    label: "Masculino Principiante",
    gender: "masculino",
    level: "principiante",
  },
  {
    value: "femenino_principiante",
    label: "Femenino Principiante",
    gender: "femenino",
    level: "principiante",
  },
  {
    value: "masculino_avanzado",
    label: "Masculino Avanzado",
    gender: "masculino",
    level: "avanzado",
  },
  {
    value: "femenino_avanzado",
    label: "Femenino Avanzado",
    gender: "femenino",
    level: "avanzado",
  },
];

export const CATEGORY_LABELS = CATEGORIES.reduce((acc, item) => {
  acc[item.value] = item.label;
  return acc;
}, {});

export function getCategoryInfo(categoryValue) {
  return CATEGORIES.find((item) => item.value === categoryValue) || null;
}

export function getCategoryLabel(categoryValue) {
  return CATEGORY_LABELS[categoryValue] || categoryValue || "Sin categoría";
}

export function getLevelFromCategory(categoryValue) {
  return getCategoryInfo(categoryValue)?.level || null;
}