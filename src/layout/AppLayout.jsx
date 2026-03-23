import Navbar from "./Navbar"
import "../styles/layout.css"

export default function AppLayout({ children }) {
  return (
    <div className="app-container">
      {/* Fondo global (no interfiere con contenido) */}
      <div className="app-bg" aria-hidden="true" />
      <Navbar />
      <main className="main-content">{children}</main>
    </div>
  )
}