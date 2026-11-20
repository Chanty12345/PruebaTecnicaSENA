
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

function Sidebar({ usuario }) {
  const { cerrarSesion } = useAuth()
  const navigate = useNavigate()

  const salir = () => {
    cerrarSesion()
    navigate('/login', { replace: true })
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon">O</div>

        <div>
          <h2>ORION</h2>
          <span>Maintenance Lite</span>
        </div>
      </div>

      <div className="sidebar-section">
        <span className="sidebar-label">MENÚ PRINCIPAL</span>

        <NavLink to="/" end className={({ isActive }) =>
          isActive ? 'nav-item active' : 'nav-item'
        }>
          <span>▦</span>
          Inicio
        </NavLink>

        <NavLink to="/activos" className={({ isActive }) =>
          isActive ? 'nav-item active' : 'nav-item'
        }>
          <span>▣</span>
          Activos
        </NavLink>

        <NavLink to="/ordenes" className={({ isActive }) =>
          isActive ? 'nav-item active' : 'nav-item'
        }>
          <span>☷</span>
          Órdenes de trabajo
        </NavLink>
      </div>

      <div className="sidebar-footer">
        <div className="user-avatar">
          {usuario?.nombres?.charAt(0) || 'U'}
        </div>

        <div className="user-info">
          <strong>
            {usuario?.nombres || 'Usuario'}
          </strong>
          <span>{usuario?.rol || 'Sin rol'}</span>
        </div>

        <button
          type="button"
          className="logout-button"
          onClick={salir}
          title="Cerrar sesión"
        >
          Salir
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
