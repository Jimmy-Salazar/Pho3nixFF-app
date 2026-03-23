export default function Pdas() {
  const month = new Date().getMonth()

  if (month !== 11) {
    return <p>Los PDA solo pueden crearse en diciembre.</p>
  }

  return <h2>Gestión de PDA</h2>
}