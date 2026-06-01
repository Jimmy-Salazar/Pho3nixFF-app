// src/pages/admin/pr/utils/exerciseFigures.js

const BASE_PATH = "/pr-exercises"

const FIGURES = [
  {
    keywords: ["deadlift", "peso muerto"],
    file: "deadlift.png",
  },
  {
    keywords: ["snatch", "arranque"],
    file: "snatch.png",
  },
  {
    keywords: ["back squat", "sentadilla trasera"],
    file: "back-squat.png",
  },
  {
    keywords: ["overhead squat", "ohs"],
    file: "overhead-squat.png",
  },
  {
    keywords: ["hang power clean", "hpc"],
    file: "hang-power-clean.png",
  },
  {
    keywords: ["squat clean"],
    file: "squat-clean.png",
  },
  {
    keywords: ["front squat", "sentadilla frontal"],
    file: "front-squat.png",
  },
  {
    keywords: ["push jerk"],
    file: "push-jerk.png",
  },
  {
    keywords: ["bench press", "press banca"],
    file: "bench-press.png",
  },
  {
    keywords: ["push press"],
    file: "push-press.png",
  },
  {
    keywords: ["power clean"],
    file: "power-clean.png",
  },
  {
    keywords: ["clean and jerk", "clean jerk", "clean & jerk"],
    file: "clean-and-jerk.png",
  },
  {
    keywords: ["thruster", "thrusters"],
    file: "thrusters.png",
  },
]

export function getExerciseFigure(name = "") {
  const normalized = normalizeExerciseName(name)

  const match = FIGURES.find((item) =>
    item.keywords.some((keyword) => normalized.includes(keyword))
  )

  return `${BASE_PATH}/${match?.file || "default.png"}`
}

function normalizeExerciseName(name = "") {
  return String(name)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "and")
    .trim()
}