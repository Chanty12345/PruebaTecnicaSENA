import { useState } from 'react'

function ActivoForm({ activo, onGuardar, onCancelar, cargando }) {
  const [formulario, setFormulario] = useState(() => ({
    nombre: activo?.nombre || '',
    tipo: activo?.tipo || '',
    ubicacion: activo?.ubicacion || '',
    fechaRegistro: activo?.fechaRegistro
      ? String(activo.fechaRegistro).slice(0, 10)
      : ''
  }))

  const manejarCambio = (e) => {
    const { name, value } = e.target

    setFormulario((anterior) => ({
      ...anterior,
      [name]: value
    }))
  }

  const manejarEnvio = async (e) => {
    e.preventDefault()
    await onGuardar(formulario)
  }

  return (
    <form className="activo-form" onSubmit={manejarEnvio}>
      <h3>{activo ? 'Editar activo' : 'Registrar activo'}</h3>

      <div className="activo-form-grid">
        <div className="activo-campo">
          <label htmlFor="nombre">Nombre</label>
          <input
            id="nombre"
            name="nombre"
            type="text"
            value={formulario.nombre}
            onChange={manejarCambio}
            placeholder="Ej. Computador portátil"
            maxLength={150}
            required
          />
        </div>

        <div className="activo-campo">
          <label htmlFor="tipo">Tipo</label>
          <input
            id="tipo"
            name="tipo"
            type="text"
            value={formulario.tipo}
            onChange={manejarCambio}
            placeholder="Ej. Equipo de cómputo"
            maxLength={100}
            required
          />
        </div>

        <div className="activo-campo">
          <label htmlFor="ubicacion">Ubicación</label>
          <input
            id="ubicacion"
            name="ubicacion"
            type="text"
            value={formulario.ubicacion}
            onChange={manejarCambio}
            placeholder="Ej. Laboratorio 1"
            maxLength={150}
            required
          />
        </div>

        <div className="activo-campo">
          <label htmlFor="fechaRegistro">Fecha de registro</label>
          <input
            id="fechaRegistro"
            name="fechaRegistro"
            type="date"
            value={formulario.fechaRegistro}
            onChange={manejarCambio}
            required
          />
        </div>
      </div>

      <div className="activo-form-acciones">
        <button
          type="submit"
          className="activo-boton activo-boton-principal"
          disabled={cargando}
        >
          {cargando
            ? 'Guardando...'
            : activo
              ? 'Guardar cambios'
              : 'Registrar activo'}
        </button>

        <button
          type="button"
          className="activo-boton activo-boton-secundario"
          onClick={onCancelar}
          disabled={cargando}
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}

export default ActivoForm