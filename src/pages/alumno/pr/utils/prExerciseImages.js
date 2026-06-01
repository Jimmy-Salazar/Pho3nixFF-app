const exerciseImageModules = import.meta.glob(
  "../../../../assets/pr-exercises/*.{png,jpg,jpeg,webp,svg}",
  {
    eager: true,
    query: "?url",
    import: "default",
  }
)

const exerciseImages = Object.entries(exerciseImageModules).reduce(
  (acc, [path, url]) => {
    const fileName = path.split("/").pop() || ""
    const nameWithoutExtension = fileName.replace(/\.(png|jpg|jpeg|webp|svg)$/i, "")
    const slug = slugifyExercise(nameWithoutExtension)

    if (slug) {
      acc[slug] = url
    }

    return acc
  },
  {}
)

const ALIASES = {
  "power-clean": ["power-clean", "clean-power"],
  "back-squat": ["back-squat", "backsquat"],
  deadlift: ["deadlift", "dead-lift"],
  "front-squat": ["front-squat", "frontsquat"],
  "overhead-squat": ["overhead-squat", "ohs"],
  "strict-press": ["strict-press", "shoulder-press"],
  "bench-press": ["bench-press"],
  snatch: ["snatch"],
  "clean-and-jerk": ["clean-and-jerk", "clean-jerk", "cleanjerk"],
  "squat-clean": ["squat-clean"],
  "hang-power-clean": ["hang-power-clean"],
  "push-press": ["push-press"],
  thruster: ["thruster"],
  "pull-up": ["pull-up", "pull-ups", "pullup", "pullups"],
}

export function getPrExerciseImage(exerciseName) {
  const slug = slugifyExercise(exerciseName)

  if (!slug) return ""

  if (exerciseImages[slug]) {
    return exerciseImages[slug]
  }

  const aliasKeys = Object.keys(ALIASES)

  for (const key of aliasKeys) {
    const aliases = ALIASES[key]

    if (aliases.includes(slug)) {
      const foundAlias = aliases.find((alias) => exerciseImages[alias])

      if (foundAlias) {
        return exerciseImages[foundAlias]
      }

      if (exerciseImages[key]) {
        return exerciseImages[key]
      }
    }
  }

  return ""
}

export function slugifyExercise(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "and")
    .replace(/\+/g, "plus")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}