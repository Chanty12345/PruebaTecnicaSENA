function OrdenTable({
  ordenes,
  esAdministrador,
  esMantenimiento,
  usuarioId,
  onVerDetalle,
  onEditar,
  onAsignar,
  onCambiarEstado,
  accionandoId
}) {
  const formatearFecha = (fecha) => {
    if (!fecha) return '—'

    const fechaTexto = String(fecha).slice(0, 10)
    const [anio, mes, dia] = fechaTexto.split('-')

    return `${dia}/${mes}/${anio}`
  }

  const obtenerResponsables = (orden) => {
    if (!orden.responsables?.length) {
      return 'Sin asignar'
    }

    return orden.responsables
      .map((responsable) => {
        const usuario = responsable.usuario

        return usuario
          ? `${usuario.nombres} ${usuario.apellidos}`
          : 'Usuario'
      })
      .join(', ')
  }

  const estaAsignado = (orden) => {
    return orden.responsables?.some(
      (responsable) => responsable.usuarioId === usuarioId
    )
  }

  const obtenerSiguientesEstados = (estado) => {
    const transiciones = {
      pendiente: ['en_proceso', 'cancelada'],
      en_proceso: ['finalizada', 'cancelada'],
      finalizada: ['en_proceso'],
      cancelada: []
    }

    return transiciones[estado] || []
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

  const formatearPrioridad = (prioridad) => {
    const nombres = {
      baja: 'Baja',
      media: 'Media',
      alta: 'Alta'
    }

    return nombres[prioridad] || prioridad
  }

  if (ordenes.length === 0) {
    return (
      <div className="orden-vacio">
        No hay órdenes de trabajo registradas.
      </div>
    )
  }

  return (
    <div className="orden-tabla-contenedor">
      <table className="orden-tabla">
        <thead>
          <tr>
            <th>ID</th>
            <th>Activo</th>
            <th>Título</th>
            <th>Prioridad</th>
            <th>Estado</th>
            <th>Responsables</th>
            <th>Fecha de creación</th>
            <th>Acciones</th>
          </tr>
        </thead>

        <tbody>
          {ordenes.map((orden) => {
            const puedeGestionar =
              esAdministrador || (esMantenimiento && estaAsignado(orden))

            const siguientesEstados = obtenerSiguientesEstados(orden.estado)

            return (
              <tr key={orden.id}>
                <td>#{orden.id}</td>

                <td>
                  {orden.activo
                    ? orden.activo.nombre
                    : 'Activo no disponible'}
                </td>

                <td>{orden.titulo}</td>

                <td>
                  <span className={`orden-prioridad orden-prioridad-${orden.prioridad}`}>
                    {formatearPrioridad(orden.prioridad)}
                  </span>
                </td>

                <td>
                  <span className={`orden-estado orden-estado-${orden.estado}`}>
                    {formatearEstado(orden.estado)}
                  </span>
                </td>

                <td className="orden-responsables">
                  {obtenerResponsables(orden)}
                </td>

                <td>{formatearFecha(orden.createdAt)}</td>

                <td>
                  <div className="orden-acciones">
                    <button
                      type="button"
                      className="orden-boton-tabla"
                      onClick={() => onVerDetalle(orden)}
                    >
                      Ver
                    </button>

                    {puedeGestionar && !['finalizada', 'cancelada'].includes(orden.estado) && (
                      <button
                        type="button"
                        className="orden-boton-tabla"
                        onClick={() => onEditar(orden)}
                        disabled={Boolean(accionandoId)}
                      >
                        Editar
                      </button>
                    )}

                    {esAdministrador && !['finalizada', 'cancelada'].includes(orden.estado) && (
                      <button
                        type="button"
                        className="orden-boton-tabla"
                        onClick={() => onAsignar(orden)}
                        disabled={Boolean(accionandoId)}
                      >
                        Asignar
                      </button>
                    )}

                    {puedeGestionar && siguientesEstados.length > 0 && (
                      <select
                        className="orden-estado-select"
                        value=""
                        onChange={(e) => {
                          if (e.target.value) {
                            onCambiarEstado(orden, e.target.value)
                          }
                        }}
                        disabled={Boolean(accionandoId)}
                        aria-label={`Cambiar estado de la orden ${orden.id}`}
                      >
                        <option value="">Cambiar estado</option>

                        {siguientesEstados.map((estado) => (
                          <option key={estado} value={estado}>
                            {formatearEstado(estado)}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default OrdenTable
