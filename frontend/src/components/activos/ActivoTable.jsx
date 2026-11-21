function ActivoTable({
  activos,
  esAdministrador,
  onVerDetalle,
  onEditar,
  onDesactivar,
  onReactivar,
  accionandoId
}) {
  const formatearFecha = (fecha) => {
    if (!fecha) return '—'

    const fechaTexto = String(fecha).slice(0, 10)
    const [anio, mes, dia] = fechaTexto.split('-')

    return `${dia}/${mes}/${anio}`
  }

  if (activos.length === 0) {
    return (
      <div className="activo-vacio">
        No hay activos registrados.
      </div>
    )
  }

  return (
    <div className="activo-tabla-contenedor">
      <table className="activo-tabla">
        <thead>
          <tr>
            <th>Inventario</th>
            <th>Nombre</th>
            <th>Tipo</th>
            <th>Ubicación</th>
            <th>Fecha de registro</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>

        <tbody>
          {activos.map((activo) => (
            <tr key={activo.id}>
              <td>{activo.inventory}</td>
              <td>{activo.nombre}</td>
              <td>{activo.tipo}</td>
              <td>{activo.ubicacion}</td>
              <td>{formatearFecha(activo.fechaRegistro)}</td>

              <td>
                <span
                  className={
                    activo.estado
                      ? 'activo-estado activo-estado-activo'
                      : 'activo-estado activo-estado-inactivo'
                  }
                >
                  {activo.estado ? 'Activo' : 'Inactivo'}
                </span>
              </td>

              <td>
                <div className="activo-acciones">
                  <button
                    type="button"
                    className="activo-boton-tabla activo-boton-detalle"
                    onClick={() => onVerDetalle(activo.id)}
                    disabled={Boolean(accionandoId)}
                  >
                    Ver detalle
                  </button>

                  {esAdministrador && (
                    <>
                      <button
                        type="button"
                        className="activo-boton-tabla"
                        onClick={() => onEditar(activo)}
                        disabled={Boolean(accionandoId)}
                      >
                        Editar
                      </button>

                      {activo.estado ? (
                        <button
                          type="button"
                          className="activo-boton-tabla activo-boton-peligro"
                          onClick={() => onDesactivar(activo)}
                          disabled={Boolean(accionandoId)}
                        >
                          {accionandoId === activo.id
                            ? 'Procesando...'
                            : 'Desactivar'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="activo-boton-tabla activo-boton-reactivar"
                          onClick={() => onReactivar(activo)}
                          disabled={Boolean(accionandoId)}
                        >
                          {accionandoId === activo.id
                            ? 'Procesando...'
                            : 'Reactivar'}
                        </button>
                      )}
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default ActivoTable
