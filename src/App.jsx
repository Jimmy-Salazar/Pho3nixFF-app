import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"

import Home from "./pages/Home"
import Login from "./pages/Login"
import SetPassword from "./pages/SetPassword"

// Páginas normales
import Dashboard from "./pages/admin/Dashboard"
import Profile from "./pages/Profile"
import RegistrarRM from "./pages/RegistrarRM"
import Admin from "./pages/Admin"
import Users from "./pages/admin/Users"
import Wods from "./pages/Wods"
import AdminWods from "./pages/admin/Wods"
import PDA from "./pages/PDA"
import PDAAdmin from "./pages/admin/PDAAdmin"
import Competencias from "./pages/Competencias"
import CompetenciasAdmin from "./pages/admin/CompetenciasAdmin"
import CompetenciaDetalleAdmin from "./pages/admin/CompetenciaDetalleAdmin"
import CompetidoresAdmin from "./pages/admin/CompetidoresAdmin"

// Layout
import AppLayout from "./layout/AppLayout"

// Protecciones
import ProtectedRoute from "./components/ProtectedRoute"
import ProtectedAdminRoute from "./components/ProtectedAdminRoute"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Pública principal */}
        <Route path="/" element={<Home />} />

        {/* Públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/set-password" element={<SetPassword />} />

        {/* Privadas */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Dashboard />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/perfil"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Profile />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/registrar-rm"
          element={
            <ProtectedRoute>
              <AppLayout>
                <RegistrarRM />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/wods"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Wods />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/pda"
          element={
            <ProtectedRoute>
              <AppLayout>
                <PDA />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/competencias"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Competencias />
              </AppLayout>
            </ProtectedRoute>
          }
        />
		
		<Route
		  path="/admin/competencias/competidores"
		  element={
			<ProtectedRoute>
			  <AppLayout>
				<ProtectedAdminRoute>
				  <CompetidoresAdmin />
				</ProtectedAdminRoute>
			  </AppLayout>
			</ProtectedRoute>
		  }
		/>

        {/* ADMIN */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AppLayout>
                <ProtectedAdminRoute>
                  <Admin />
                </ProtectedAdminRoute>
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/users"
          element={
            <ProtectedRoute>
              <AppLayout>
                <ProtectedAdminRoute>
                  <Users />
                </ProtectedAdminRoute>
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/wods"
          element={
            <ProtectedRoute>
              <AppLayout>
                <ProtectedAdminRoute>
                  <AdminWods />
                </ProtectedAdminRoute>
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/pda"
          element={
            <ProtectedRoute>
              <AppLayout>
                <ProtectedAdminRoute>
                  <PDAAdmin />
                </ProtectedAdminRoute>
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/competencias"
          element={
            <ProtectedRoute>
              <AppLayout>
                <ProtectedAdminRoute>
                  <CompetenciasAdmin />
                </ProtectedAdminRoute>
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/competencias/:id"
          element={
            <ProtectedRoute>
              <AppLayout>
                <ProtectedAdminRoute>
                  <CompetenciaDetalleAdmin />
                </ProtectedAdminRoute>
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}