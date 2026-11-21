
import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/useAuth'

import {
  listarActivos,
  obtenerActivoPorId,
  crearActivo,
  actualizarActivo,
  desactivarActivo,
  reactivarActivo
} from '../services/activoService'

import ActivoForm from '../components/activos/ActivoForm'
import ActivoTable from '../components/activos/ActivoTable'

import '../styles/Activos.css'

// Obtener un mensaje entendible cuando ocurre un error
const obtenerMensajeError = (error) => {
  return error.response?.data?.message ||
    'Ocurrió un error. Intenta nuevamente.'
}

// Formatear fechas para mostrarlas en formato DD/MM/AAAA
const formatearFecha = (fecha) => {
  if (!fecha) return '—'

  const fechaTexto = String(fecha).slice(0, 10)
  const [anio, mes, dia] = fechaTexto.split('-')

  return `${dia}/${mes}/${anio}`
}

function Activos() {
  const { usuario } = useAuth()

  const [activos, setActivos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [cargandoFormulario, setCargandoFormulario] = useState(false)
  const [accionandoId, setAccionandoId] = useState(null)

  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [activoEditar, setActivoEditar] = useState(null)

  const [activoDetalle, setActivoDetalle] = useState(null)
  const [cargandoDetalle, setCargandoDetalle] = useState(false)

  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')

  const esAdministrador = usuario?.rol === 'administrador'

  // Consultar los activos del backend
  const cargarActivos = useCallback(async () => {
    setCargando(true)
    setError('')

    try {
      const datos = await listarActivos()
      setActivos(datos)
    } catch (error) {
      setError(obtenerMensajeError(error))
    } finally {
      setCargando(false)
    }
  }, [])

  // Cargar los activos cuando se abre la página
  useEffect(() => {
    let cancelado = false

    const cargarDatosIniciales = async () => {
      try {
        const datos = await listarActivos()

        if (!cancelado) {
          setActivos(datos)
        }
      } catch (error) {
        if (!cancelado) {
          setError(obtenerMensajeError(error))
        }
      } finally {
        if (!cancelado) {
          setCargando(false)
        }
      }
    }

    cargarDatosIniciales()

    return () => {
      cancelado = true
    }
  }, [])

  // Abrir el formulario para registrar
  const abrirFormularioNuevo = () => {
    setActivoEditar(null)
    setActivoDetalle(null)
    setMensaje('')
    setError('')
    setMostrarFormulario(true)
  }

  // Abrir el formulario para editar
  const abrirFormularioEditar = (activo) => {
    setActivoEditar(activo)
    setActivoDetalle(null)
    setMensaje('')
    setError('')
    setMostrarFormulario(true)
  }

  // Cerrar el formulario
  const cerrarFormulario = () => {
    setMostrarFormulario(false)
    setActivoEditar(null)
  }

  // Consultar el detalle completo de un activo
  const abrirDetalle = async (id) => {
    setCargandoDetalle(true)
    setActivoDetalle(null)
    setMostrarFormulario(false)
    setActivoEditar(null)
    setError('')
    setMensaje('')

    try {
      const datos = await obtenerActivoPorId(id)
      setActivoDetalle(datos)
    } catch (error) {
      setError(obtenerMensajeError(error))
    } finally {
      setCargandoDetalle(false)
    }
  }

  // Cerrar el detalle del activo
  const cerrarDetalle = () => {
    setActivoDetalle(null)
  }

  // Registrar o actualizar un activo
  const guardarActivo = async (datos) => {
    setCargandoFormulario(true)
    setError('')
    setMensaje('')

    try {
      if (activoEditar) {
        await actualizarActivo(activoEditar.id, datos)
        setMensaje('Activo actualizado correctamente.')
      } else {
        await crearActivo(datos)
        setMensaje('Activo registrado correctamente.')
      }

      cerrarFormulario()
      await cargarActivos()
    } catch (error) {
      setError(obtenerMensajeError(error))
    } finally {
      setCargandoFormulario(false)
    }
  }

  // Desactivar un activo
  const manejarDesactivacion = async (activo) => {
    const confirmar = window.confirm(
      `¿Estás seguro de desactivar el activo ${activo.nombre}?`
    )

    if (!confirmar) return

    setAccionandoId(activo.id)
    setError('')
    setMensaje('')

    try {
      await desactivarActivo(activo.id)
      setMensaje('Activo desactivado correctamente.')
      await cargarActivos()
    } catch (error) {
      setError(obtenerMensajeError(error))
    } finally {
      setAccionandoId(null)
    }
  }

  // Reactivar un activo
  const manejarReactivacion = async (activo) => {
    const confirmar = window.confirm(
      `¿Estás seguro de reactivar el activo ${activo.nombre}?`
    )

    if (!confirmar) return

    setAccionandoId(activo.id)
    setError('')
    setMensaje('')

    try {
      await reactivarActivo(activo.id)
      setMensaje('Activo reactivado correctamente.')
      await cargarActivos()
    } catch (error) {
      setError(obtenerMensajeError(error))
    } finally {
      setAccionandoId(null)
    }
  }

  // Separar los activos según su estado
  const activosActivos = activos.filter((activo) => activo.estado)
  const activosInactivos = activos.filter((activo) => !activo.estado)

  return (
    <section className="activos-pagina">
      <div className="activos-encabezado">
        <div>
          <h1>Gestión de activos</h1>
          <p>Administra y consulta los activos tecnológicos de ORION.</p>
        </div>

        {esAdministrador && (
          <button
            type="button"
            className="activo-boton activo-boton-principal"
            onClick={abrirFormularioNuevo}
            disabled={cargandoFormulario || accionandoId !== null}
          >
            + Registrar activo
          </button>
        )}
      </div>

      <div className="activos-resumen">
        <div className="activo-resumen-tarjeta">
          <span>Total de activos</span>
          <strong>{activos.length}</strong>
        </div>

        <div className="activo-resumen-tarjeta">
          <span>Activos activos</span>
          <strong>{activosActivos.length}</strong>
        </div>

        <div className="activo-resumen-tarjeta">
          <span>Activos inactivos</span>
          <strong>{activosInactivos.length}</strong>
        </div>
      </div>

      {error && (
        <div className="activo-mensaje activo-mensaje-error" role="alert">
          {error}
        </div>
      )}

      {mensaje && (
        <div className="activo-mensaje activo-mensaje-exito" role="status">
          {mensaje}
        </div>
      )}

      {mostrarFormulario && esAdministrador && (
        <ActivoForm
          key={activoEditar?.id ?? 'nuevo'}
          activo={activoEditar}
          onGuardar={guardarActivo}
          onCancelar={cerrarFormulario}
          cargando={cargandoFormulario}
        />
      )}

      {cargandoDetalle && (
        <div className="activo-detalle">
          <p className="activo-cargando">
            Consultando detalle del activo...
          </p>
        </div>
      )}

      {activoDetalle && (
        <div className="activo-detalle">
          <div className="activo-detalle-encabezado">
            <h2>Detalle del activo</h2>

            <button
              type="button"
              className="activo-boton activo-boton-secundario"
              onClick={cerrarDetalle}
            >
              Cerrar
            </button>
          </div>

          <div className="activo-detalle-grid">
            <div>
              <span>Identificador</span>
              <strong>{activoDetalle.id}</strong>
            </div>

            <div>
              <span>Código de inventario</span>
              <strong>{activoDetalle.inventory || '—'}</strong>
            </div>

            <div>
              <span>Nombre</span>
              <strong>{activoDetalle.nombre}</strong>
            </div>

            <div>
              <span>Tipo de activo</span>
              <strong>{activoDetalle.tipo}</strong>
            </div>

            <div>
              <span>Ubicación</span>
              <strong>{activoDetalle.ubicacion}</strong>
            </div>

            <div>
              <span>Fecha de registro</span>
              <strong>
                {formatearFecha(activoDetalle.fechaRegistro)}
              </strong>
            </div>

            <div>
              <span>Estado</span>
              <strong>
                {activoDetalle.estado ? 'Activo' : 'Inactivo'}
              </strong>
            </div>
          </div>
        </div>
      )}

      <div className="activos-listado">
        <div className="activos-listado-encabezado">
          <h2>Inventario de activos</h2>

          <button
            type="button"
            className="activo-boton activo-boton-secundario"
            onClick={cargarActivos}
            disabled={cargando || accionandoId !== null}
          >
            {cargando ? 'Actualizando...' : 'Actualizar listado'}
          </button>
        </div>

        {cargando ? (
          <p className="activo-cargando">Cargando activos...</p>
        ) : (
          <ActivoTable
            activos={activos}
            esAdministrador={esAdministrador}
            onVerDetalle={abrirDetalle}
            onEditar={abrirFormularioEditar}
            onDesactivar={manejarDesactivacion}
            onReactivar={manejarReactivacion}
            accionandoId={accionandoId}
          />
        )}
      </div>
    </section>
  )
}

export default Activos
