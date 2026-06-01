import WodSection from "./WodSection"
import PromosEventosSection from "./PromosEventosSection"

export default function TrainingAndPromosSection({
  todayWod,
  todayWodLoading,
  visualItems,
  promoRef,
  navigate,
}) {
  return (
    <section className="mt-8 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)] xl:items-stretch">
      <WodSection
        todayWod={todayWod}
        todayWodLoading={todayWodLoading}
        navigate={navigate}
      />

      <PromosEventosSection
        visualItems={visualItems}
        promoRef={promoRef}
        compact
      />
    </section>
  )
}
