
function Dashboard() {
  return (
    <div className="dashboard">
      <div className="welcome-section">
        <div>
          <h2>Bienvenido a ORION</h2>
          <p>
            Administra los activos tecnológicos y supervisa las
            actividades de mantenimiento.
          </p>
        </div>

        <span className="welcome-icon">⚙</span>
      </div>

      <section className="dashboard-cards">
        <article className="dashboard-card">
          <div className="card-icon blue">▣</div>
          <span>Total de activos</span>
          <strong>--</strong>
          <small>Activos registrados</small>
        </article>

        <article className="dashboard-card">
          <div className="card-icon orange">☷</div>
          <span>Órdenes pendientes</span>
          <strong>--</strong>
          <small>Requieren atención</small>
        </article>

        <article className="dashboard-card">
          <div className="card-icon green">✓</div>
          <span>Órdenes finalizadas</span>
          <strong>--</strong>
          <small>Trabajos completados</small>
        </article>
      </section>

      <section className="dashboard-information">
        <div className="section-heading">
          <div>
            <h3>Gestión de mantenimiento</h3>
            <p>Accede a los módulos principales del sistema.</p>
          </div>
        </div>

        <div className="quick-access">
          <div className="access-card">
            <span className="access-icon">▣</span>
            <h4>Activos tecnológicos</h4>
            <p>Consulta y administra el inventario de activos.</p>
          </div>

          <div className="access-card">
            <span className="access-icon">☷</span>
            <h4>Órdenes de trabajo</h4>
            <p>Registra y supervisa los mantenimientos.</p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Dashboard
