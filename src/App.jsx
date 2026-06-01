import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"

// =======================================================
// PÁGINAS PÚBLICAS
// =======================================================
import Home from "./pages/Home"
import Login from "./pages/login/Login"
import SetPassword from "./pages/SetPassword"

// =======================================================
// PÁGINAS GENERALES / COMPARTIDAS
// =======================================================
import PDA from "./pages/PDA"
import Competencias from "./pages/Competencias"

// =======================================================
// PÁGINAS ALUMNO
// =======================================================
import AlumnoDashboard from "./pages/alumno/Dashboard"
import WodsAlumno from "./pages/alumno/wods/WodsAlumno"
import PersonalRecordsAlumno from "./pages/alumno/pr/PersonalRecordsAlumno"
import ProfileAlumno from "./pages/alumno/profile/Profile"

// =======================================================
// PÁGINAS ADMIN / COACH
// =======================================================
import AdminDashboard from "./pages/admin/Dashboard"
import Users from "./pages/admin/Users"
import RegistrarRM from "./pages/admin/RegistrarRM"
import AdminWods from "./pages/admin/Wods"
import PDAAdmin from "./pages/admin/PDAAdmin"
import CompetenciasAdmin from "./pages/admin/CompetenciasAdmin"
import ChallengeAdmin from "./pages/admin/Challenge"
import Anuncios from "./pages/admin/Anuncios"

// =======================================================
// LAYOUT
// =======================================================
import AppLayout from "./layout/AppLayout"

// =======================================================
// PROTECCIONES / REDIRECCIÓN POR ROL
// =======================================================
import ProtectedRoute from "./components/ProtectedRoute"
import ProtectedAdminRoute from "./components/ProtectedAdminRoute"
import RoleRedirect from "./components/RoleRedirect"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* =======================================================
            RUTAS PÚBLICAS
        ======================================================= */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/set-password" element={<SetPassword />} />

        {/* =======================================================
            REDIRECCIONES BASE
        ======================================================= */}
        <Route
          path="/admin"
          element={<Navigate to="/admin/dashboard" replace />}
        />

        <Route
          path="/alumno"
          element={<Navigate to="/alumno/dashboard" replace />}
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <RoleRedirect />
            </ProtectedRoute>
          }
        />

        {/* =======================================================
            REDIRECCIONES ANTIGUAS / COMPATIBILIDAD
        ======================================================= */}
        <Route
          path="/admin/users"
          element={<Navigate to="/admin/alumnos" replace />}
        />

        <Route
          path="/challenger"
          element={<Navigate to="/admin/challenge" replace />}
        />

        <Route
          path="/registrar-rm"
          element={
            <ProtectedRoute>
              <RoleRedirect />
            </ProtectedRoute>
          }
        />

        <Route
          path="/personalrecord"
          element={<Navigate to="/alumno/personalrecord" replace />}
        />

        <Route
          path="/wods"
          element={<Navigate to="/alumno/wods" replace />}
        />

        <Route
          path="/perfil"
          element={<Navigate to="/alumno/perfil" replace />}
        />

        <Route
          path="/profile"
          element={<Navigate to="/alumno/perfil" replace />}
        />

        {/* =======================================================
            RUTAS ALUMNO
        ======================================================= */}
        <Route
          path="/alumno/dashboard"
          element={
            <ProtectedRoute>
              <AlumnoDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/alumno/wods"
          element={
            <ProtectedRoute>
              <WodsAlumno />
            </ProtectedRoute>
          }
        />

        <Route
          path="/alumno/personalrecord"
          element={
            <ProtectedRoute>
              <PersonalRecordsAlumno />
            </ProtectedRoute>
          }
        />

        <Route
          path="/alumno/personalrecords"
          element={<Navigate to="/alumno/personalrecord" replace />}
        />

        <Route
          path="/alumno/pr"
          element={<Navigate to="/alumno/personalrecord" replace />}
        />

        <Route
          path="/alumno/perfil"
          element={
            <ProtectedRoute>
              <ProfileAlumno />
            </ProtectedRoute>
          }
        />

        {/* =======================================================
            RUTAS GENERALES PROTEGIDAS
        ======================================================= */}
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

        {/* =======================================================
            RUTAS ADMIN / COACH
        ======================================================= */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute>
              <ProtectedAdminRoute>
                <AdminDashboard />
              </ProtectedAdminRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/alumnos"
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
          path="/admin/personalrecord"
          element={
            <ProtectedRoute>
              <AppLayout>
                <ProtectedAdminRoute>
                  <RegistrarRM />
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
          path="/admin/challenge"
          element={
            <ProtectedRoute>
              <ProtectedAdminRoute>
                <ChallengeAdmin />
              </ProtectedAdminRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/anuncios"
          element={
            <ProtectedRoute>
              <AppLayout>
                <ProtectedAdminRoute>
                  <Anuncios />
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

        {/* =======================================================
            RUTA NO ENCONTRADA
        ======================================================= */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}