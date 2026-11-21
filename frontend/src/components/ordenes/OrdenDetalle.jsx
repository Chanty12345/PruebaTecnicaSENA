function OrdenDetalle({ orden, onCerrar }) {
  const formatearFecha = (fecha) => {
    if (!fecha) return '—'

    return new Date(fecha).toLocaleString('es-CO', {
      dateStyle: 'short',
      timeStyle: 'short'
    })
  }

  const formatearEstado = (estado) => {
    const nombres = {
      pendiente: 'Pendiente',
      en_proceso: 'En proceso',
      finalizada: 'Finalizada',
      cancelada: 'Cancelada'
    }

    return nombres[estado] || estado
  }

  return (
    <section className="orden-detalle">
      <div className="orden-detalle-encabezado">
        <div>
          <h3>Detalle de la orden #{orden.id}</h3>
          <p>Información y seguimiento del mantenimiento.</p>
        </div>

        <button
          type="button"
          className="orden-boton orden-boton-secundario"
          onClick={onCerrar}
        >
          Cerrar
        </button>
      </div>

      <div className="orden-detalle-grid">
        <div>
          <span>Activo</span>
          <strong>{orden.activo?.nombre || 'No disponible'}</strong>
        </div>

        <div>
          <span>Inventario</span>
          <strong>{orden.activo?.inventory || '—'}</strong>
        </div>

        <div>
          <span>Título</span>
          <strong>{orden.titulo}</strong>
        </div>

        <div>
          <span>Prioridad</span>
          <strong>{orden.prioridad}</strong>
        </div>

        <div>
          <span>Estado</span>
          <strong>{formatearEstado(orden.estado)}</strong>
        </div>

        <div>
          <span>Fecha de creación</span>
          <strong>{formatearFecha(orden.createdAt)}</strong>
        </div>

        <div className="orden-detalle-descripcion">
          <span>Descripción</span>
          <p>{orden.descripcion}</p>
        </div>
      </div>

      <div className="orden-detalle-seccion">
        <h4>Responsables asignados</h4>

        {orden.responsables?.length > 0 ? (
          <ul>
            {orden.responsables.map((responsable) => (
              <li key={responsable.id}>
                <strong>
                  {responsable.usuario
                    ? `${responsable.usuario.nombres} ${responsable.usuario.apellidos}`
                    : 'Usuario no disponible'}
                </strong>

                <span>{responsable.funcion}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p>No hay responsables asignados.</p>
        )}
      </div>

      <div className="orden-detalle-seccion">
        <h4>Historial de estados</h4>

        {orden.historial?.length > 0 ? (
          <div className="orden-historial">
            {orden.historial.map((registro) => (
              <div className="orden-historial-item" key={registro.id}>
                <div>
                  <strong>
                    {registro.estadoAnterior
                      ? formatearEstado(registro.estadoAnterior)
                      : 'Creación'}
                    {' → '}
                    {formatearEstado(registro.estadoNuevo)}
                  </strong>

                  <p>
                    Responsable del cambio:{' '}
                    {registro.usuario
                      ? `${registro.usuario.nombres} ${registro.usuario.apellidos}`
                      : 'Usuario no disponible'}
                  </p>
                </div>

                <span>{formatearFecha(registro.fechaCambio)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p>No hay cambios de estado registrados.</p>
        )}
      </div>
    </section>
  )
}

export default OrdenDetalle
