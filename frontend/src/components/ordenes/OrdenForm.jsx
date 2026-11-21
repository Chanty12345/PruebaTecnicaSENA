
import { useState } from 'react'

function OrdenForm({
  activos,
  ordenes = [],
  esAdministrador,
  orden,
  onGuardar,
  onCancelar,
  cargando
}) {
  const [datos, setDatos] = useState(() => ({
    activoId: orden?.activoId ?? '',
    titulo: orden?.titulo ?? '',
    descripcion: orden?.descripcion ?? '',
    prioridad: orden?.prioridad ?? 'media'
  }))

  const manejarCambio = (e) => {
    const { name, value } = e.target

    setDatos((datosAnteriores) => ({
      ...datosAnteriores,
      [name]: value
    }))
  }

  const manejarEnvio = (e) => {
    e.preventDefault()

    const datosEnviar = {
      titulo: datos.titulo.trim(),
      descripcion: datos.descripcion.trim()
    }

    if (!orden) {
      datosEnviar.activoId = Number(datos.activoId)
    }

    if (esAdministrador) {
      datosEnviar.prioridad = datos.prioridad
    }

    onGuardar(datosEnviar)
  }

  const activosDisponibles = activos.filter((activo) => activo.estado)

  // Obtener las órdenes del activo seleccionado
  const ordenesActivo = !orden && datos.activoId
    ? ordenes.filter(
        (ordenExistente) =>
          String(ordenExistente.activoId) === String(datos.activoId)
      )
    : []

  // Identificar las órdenes que todavía están abiertas
  const ordenesAbiertas = ordenesActivo.filter(
    (ordenExistente) =>
      ['pendiente', 'en_proceso'].includes(ordenExistente.estado)
  )

  const ordenesPendientes = ordenesActivo.filter(
    (ordenExistente) => ordenExistente.estado === 'pendiente'
  )

  const ordenesEnProceso = ordenesActivo.filter(
    (ordenExistente) => ordenExistente.estado === 'en_proceso'
  )

  return (
    <form className="orden-form" onSubmit={manejarEnvio}>
      <h3>{orden ? 'Editar orden de trabajo' : 'Registrar orden de trabajo'}</h3>

      <div className="orden-form-grid">
        {!orden && (
          <div className="orden-campo">
            <label htmlFor="activoId">Activo asociado</label>

            <select
              id="activoId"
              name="activoId"
              value={datos.activoId}
              onChange={manejarCambio}
              required
            >
              <option value="">Selecciona un activo</option>

              {activosDisponibles.map((activo) => (
                <option key={activo.id} value={activo.id}>
                  {activo.inventory} - {activo.nombre}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="orden-campo">
          <label htmlFor="titulo">Título</label>

          <input
            id="titulo"
            name="titulo"
            type="text"
            value={datos.titulo}
            onChange={manejarCambio}
            maxLength={150}
            placeholder="Ej. Mantenimiento de equipo"
            required
          />
        </div>

        {esAdministrador && (
          <div className="orden-campo">
            <label htmlFor="prioridad">Prioridad</label>

            <select
              id="prioridad"
              name="prioridad"
              value={datos.prioridad}
              onChange={manejarCambio}
            >
              <option value="baja">Baja</option>
              <option value="media">Media</option>
              <option value="alta">Alta</option>
            </select>
          </div>
        )}

        <div className="orden-campo orden-campo-completo">
          <label htmlFor="descripcion">Descripción</label>

          <textarea
            id="descripcion"
            name="descripcion"
            value={datos.descripcion}
            onChange={manejarCambio}
            rows={4}
            placeholder="Describe el problema o mantenimiento requerido"
            required
          />
        </div>
      </div>

      {!orden && datos.activoId && (
        <div className="ordenes-activo-resumen">
          <h4>Órdenes existentes de este activo</h4>

          {ordenesActivo.length === 0 ? (
            <p className="orden-ayuda">
              Este activo todavía no tiene órdenes de trabajo registradas.
            </p>
          ) : (
            <>
              <div className="ordenes-activo-contadores">
                <span>Total: {ordenesActivo.length}</span>
                <span>Pendientes: {ordenesPendientes.length}</span>
                <span>En proceso: {ordenesEnProceso.length}</span>
              </div>

              {ordenesAbiertas.length > 0 && (
                <div className="orden-mensaje orden-mensaje-advertencia" role="status">
                  Atención: este activo tiene {ordenesAbiertas.length}
                  {' '}orden(es) abierta(s). Revisa las órdenes existentes
                  antes de registrar otra.
                </div>
              )}

              <div className="ordenes-activo-listado">
                {ordenesActivo.map((ordenExistente) => (
                  <div
                    className="orden-activo-item"
                    key={ordenExistente.id}
                  >
                    <div>
                      <strong>
                        Orden #{ordenExistente.id} - {ordenExistente.titulo}
                      </strong>
                      <span>
                        Prioridad: {ordenExistente.prioridad}
                      </span>
                    </div>

                    <span
                      className={`orden-estado orden-estado-${ordenExistente.estado}`}
                    >
                      {ordenExistente.estado.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {activosDisponibles.length === 0 && !orden && (
        <p className="orden-ayuda">
          No hay activos activos disponibles para crear una orden.
        </p>
      )}

      <div className="orden-form-acciones">
        <button
          type="submit"
          className="orden-boton orden-boton-principal"
          disabled={cargando || (!orden && activosDisponibles.length === 0)}
        >
          {cargando
            ? 'Guardando...'
            : orden
              ? 'Guardar cambios'
              : 'Registrar orden'}
        </button>

        <button
          type="button"
          className="orden-boton orden-boton-secundario"
          onClick={onCancelar}
          disabled={cargando}
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}

export default OrdenForm
