import { useEffect } from "react"
import { moveCarousel } from "../utils/dashboardUtils"

export function useAutoCarousel(
  ref,
  dependencyList = [],
  { enabled = true, intervalMs = 4000 } = {}
) {
  useEffect(() => {
    if (!enabled) return
    if (!ref.current) return

    const container = ref.current
    let paused = false

    const interval = setInterval(() => {
      if (paused) return
      moveCarousel(container)
    }, intervalMs)

    const onEnter = () => {
      paused = true
    }

    const onLeave = () => {
      paused = false
    }

    container.addEventListener("mouseenter", onEnter)
    container.addEventListener("mouseleave", onLeave)
    container.addEventListener("touchstart", onEnter, { passive: true })
    container.addEventListener("touchend", onLeave)

    return () => {
      clearInterval(interval)
      container.removeEventListener("mouseenter", onEnter)
      container.removeEventListener("mouseleave", onLeave)
      container.removeEventListener("touchstart", onEnter)
      container.removeEventListener("touchend", onLeave)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencyList)
}
