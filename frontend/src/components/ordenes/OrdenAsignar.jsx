import { useState } from 'react'

function OrdenAsignar({
  orden,
  usuarios,
  onGuardar,
  onCancelar,
  cargando
}) {
  const [responsables, setResponsables] = useState(() => (
    orden.responsables?.map((responsable) => ({
      usuarioId: String(responsable.usuarioId),
      funcion: responsable.funcion
    })) || []
  ))

  const usuariosDisponibles = usuarios.filter(
    (usuario) => usuario.rol === 'mantenimiento' && usuario.estado
  )

  const agregarResponsable = () => {
    setResponsables((anteriores) => [
      ...anteriores,
      { usuarioId: '', funcion: '' }
    ])
  }

  const cambiarResponsable = (indice, campo, valor) => {
    setResponsables((anteriores) =>
      anteriores.map((responsable, posicion) =>
        posicion === indice
          ? { ...responsable, [campo]: valor }
          : responsable
      )
    )
  }

  const eliminarResponsable = (indice) => {
    setResponsables((anteriores) =>
      anteriores.filter((_, posicion) => posicion !== indice)
    )
  }

  const manejarEnvio = (e) => {
    e.preventDefault()

    const datos = responsables.map((responsable) => ({
      usuarioId: Number(responsable.usuarioId),
      funcion: responsable.funcion.trim()
    }))

    onGuardar(datos)
  }

  const idsSeleccionados = responsables.map(
    (responsable) => responsable.usuarioId
  )

  return (
    <form className="orden-form" onSubmit={manejarEnvio}>
      <h3>Asignar responsables - Orden #{orden.id}</h3>

      {responsables.map((responsable, indice) => (
        <div className="orden-asignacion-fila" key={indice}>
          <div className="orden-campo">
            <label htmlFor={`usuario-${indice}`}>
              Usuario de mantenimiento
            </label>

            <select
              id={`usuario-${indice}`}
              value={responsable.usuarioId}
              onChange={(e) =>
                cambiarResponsable(indice, 'usuarioId', e.target.value)
              }
              required
            >
              <option value="">Selecciona un usuario</option>

              {usuariosDisponibles.map((usuario) => (
                <option
                  key={usuario.id}
                  value={usuario.id}
                  disabled={
                    idsSeleccionados.includes(String(usuario.id)) &&
                    String(usuario.id) !== responsable.usuarioId
                  }
                >
                  {usuario.nombres} {usuario.apellidos}
                </option>
              ))}
            </select>
          </div>

          <div className="orden-campo">
            <label htmlFor={`funcion-${indice}`}>
              Función en la orden
            </label>

            <input
              id={`funcion-${indice}`}
              type="text"
              value={responsable.funcion}
              onChange={(e) =>
                cambiarResponsable(indice, 'funcion', e.target.value)
              }
              maxLength={100}
              placeholder="Ej. Técnico de soporte"
              required
            />
          </div>

          <button
            type="button"
            className="orden-boton orden-boton-eliminar"
            onClick={() => eliminarResponsable(indice)}
            disabled={cargando}
          >
            Quitar
          </button>
        </div>
      ))}

      {usuariosDisponibles.length === 0 && (
        <p className="orden-ayuda">
          No hay usuarios activos con rol de mantenimiento.
        </p>
      )}

      <button
        type="button"
        className="orden-boton orden-boton-secundario"
        onClick={agregarResponsable}
        disabled={
          cargando ||
          usuariosDisponibles.length === 0 ||
          responsables.length >= usuariosDisponibles.length
        }
      >
        + Agregar responsable
      </button>

      <div className="orden-form-acciones">
        <button
          type="submit"
          className="orden-boton orden-boton-principal"
          disabled={
            cargando ||
            responsables.some(
              (responsable) =>
                !responsable.usuarioId || !responsable.funcion.trim()
            )
          }
        >
          {cargando ? 'Guardando...' : 'Guardar asignación'}
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

export default OrdenAsignar
