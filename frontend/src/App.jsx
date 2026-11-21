
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import { AuthProvider } from './context/AuthContext.jsx'
import { useAuth } from './context/useAuth'
import ProtectedRoute from './components/ProtectedRoute'

import Sidebar from './components/Sidebar'
import Header from './components/Header'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Activos from './pages/Activos'

import './App.css'

function PanelPrincipal() {
  const { usuario } = useAuth()

  return (
    <div className="app-container">
      <Sidebar usuario={usuario} />

      <main className="main-content">
        <Header />

        <div className="page-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />

            <Route path="/activos" element={<Activos />} />

            <Route
              path="/ordenes"
              element={
                <div className="empty-page">
                  <h2>Órdenes de trabajo</h2>
                  <p>Gestionaremos las órdenes de mantenimiento aquí.</p>
                </div>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <PanelPrincipal />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
