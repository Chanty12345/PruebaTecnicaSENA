import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/useAuth'

import {
  listarOrdenes,
  obtenerOrdenPorId,
  crearOrden,
  actualizarOrden,
  asignarResponsables,
  cambiarEstadoOrden,
  listarUsuarios
} from '../services/ordenTrabajoService'

import { listarActivos } from '../services/activoService'

import OrdenForm from '../components/ordenes/OrdenForm'
import OrdenTable from '../components/ordenes/OrdenTable'
import OrdenDetalle from '../components/ordenes/OrdenDetalle'
import OrdenAsignar from '../components/ordenes/OrdenAsignar'

import '../styles/Ordenes.css'

// Obtener un mensaje entendible cuando ocurre un error
const obtenerMensajeError = (error) => {
  return error.response?.data?.message ||
    'Ocurrió un error. Intenta nuevamente.'
}

function Ordenes() {
  const { usuario } = useAuth()

  const [ordenes, setOrdenes] = useState([])
  const [activos, setActivos] = useState([])
  const [usuarios, setUsuarios] = useState([])

  const [cargando, setCargando] = useState(true)
  const [cargandoFormulario, setCargandoFormulario] = useState(false)
  const [accionandoId, setAccionandoId] = useState(null)

  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [ordenEditar, setOrdenEditar] = useState(null)
  const [ordenAsignar, setOrdenAsignar] = useState(null)
  const [ordenDetalle, setOrdenDetalle] = useState(null)

  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')

  const esAdministrador = usuario?.rol === 'administrador'
  const esMantenimiento = usuario?.rol === 'mantenimiento'
  const puedeCrear = esAdministrador || esMantenimiento

  // Consultar las órdenes del backend
  const cargarOrdenes = useCallback(async () => {
    setCargando(true)
    setError('')

    try {
      const datos = await listarOrdenes()
      setOrdenes(datos)
    } catch (error) {
      setError(obtenerMensajeError(error))
    } finally {
      setCargando(false)
    }
  }, [])

  // Cargar los datos iniciales
  useEffect(() => {
    let cancelado = false

    const cargarDatosIniciales = async () => {
      try {
        const [datosOrdenes, datosActivos, datosUsuarios] = await Promise.all([
          listarOrdenes(),
          listarActivos(),
          esAdministrador ? listarUsuarios() : Promise.resolve([])
        ])

        if (!cancelado) {
          setOrdenes(datosOrdenes)
          setActivos(datosActivos)
          setUsuarios(datosUsuarios)
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
  }, [esAdministrador])

  // Abrir el formulario para crear una orden
  const abrirFormularioNuevo = () => {
    setOrdenEditar(null)
    setOrdenDetalle(null)
    setOrdenAsignar(null)
    setError('')
    setMensaje('')
    setMostrarFormulario(true)
  }

  // Abrir el formulario para editar una orden
  const abrirFormularioEditar = (orden) => {
    setOrdenEditar(orden)
    setOrdenDetalle(null)
    setOrdenAsignar(null)
    setError('')
    setMensaje('')
    setMostrarFormulario(true)
  }

  // Cerrar el formulario
  const cerrarFormulario = () => {
    setMostrarFormulario(false)
    setOrdenEditar(null)
  }

  // Registrar o actualizar una orden
  const guardarOrden = async (datos) => {
    setCargandoFormulario(true)
    setError('')
    setMensaje('')

    try {
      if (ordenEditar) {
        await actualizarOrden(ordenEditar.id, datos)
        setMensaje('Orden de trabajo actualizada correctamente.')
      } else {
        const resultado = await crearOrden(datos)

        setMensaje(
          resultado.advertencia ||
          'Orden de trabajo registrada correctamente.'
        )
      }

      cerrarFormulario()
      await cargarOrdenes()
    } catch (error) {
      setError(obtenerMensajeError(error))
    } finally {
      setCargandoFormulario(false)
    }
  }

  // Consultar el detalle completo de una orden
  const verDetalle = async (orden) => {
    setError('')
    setMensaje('')
    setOrdenDetalle(null)
    setOrdenAsignar(null)
    setMostrarFormulario(false)

    try {
      const datos = await obtenerOrdenPorId(orden.id)
      setOrdenDetalle(datos)
    } catch (error) {
      setError(obtenerMensajeError(error))
    }
  }

  // Guardar los responsables de una orden
  const guardarResponsables = async (responsables) => {
    setCargandoFormulario(true)
    setError('')
    setMensaje('')

    try {
      await asignarResponsables(ordenAsignar.id, responsables)

      setMensaje('Responsables asignados correctamente.')
      setOrdenAsignar(null)

      await cargarOrdenes()
    } catch (error) {
      setError(obtenerMensajeError(error))
    } finally {
      setCargandoFormulario(false)
    }
  }

  // Cambiar el estado de una orden
  const manejarCambioEstado = async (orden, nuevoEstado) => {
    const confirmar = window.confirm(
      `¿Estás seguro de cambiar el estado de la orden #${orden.id} a ${nuevoEstado.replace('_', ' ')}?`
    )

    if (!confirmar) return

    setAccionandoId(orden.id)
    setError('')
    setMensaje('')

    try {
      await cambiarEstadoOrden(orden.id, nuevoEstado)

      setMensaje('Estado de la orden actualizado correctamente.')
      await cargarOrdenes()
    } catch (error) {
      setError(obtenerMensajeError(error))
    } finally {
      setAccionandoId(null)
    }
  }

  // Calcular cantidades para el resumen
  const ordenesAbiertas = ordenes.filter(
    (orden) => ['pendiente', 'en_proceso'].includes(orden.estado)
  )

  const ordenesFinalizadas = ordenes.filter(
    (orden) => orden.estado === 'finalizada'
  )

  return (
    <section className="ordenes-pagina">
      <div className="ordenes-encabezado">
        <div>
          <h1>Órdenes de trabajo</h1>
          <p>Gestiona y consulta las actividades de mantenimiento de ORION.</p>
        </div>

        {puedeCrear && (
          <button
            type="button"
            className="orden-boton orden-boton-principal"
            onClick={abrirFormularioNuevo}
            disabled={cargandoFormulario || accionandoId !== null}
          >
            + Registrar orden
          </button>
        )}
      </div>

      <div className="ordenes-resumen">
        <div className="orden-resumen-tarjeta">
          <span>Total de órdenes</span>
          <strong>{ordenes.length}</strong>
        </div>

        <div className="orden-resumen-tarjeta">
          <span>Órdenes abiertas</span>
          <strong>{ordenesAbiertas.length}</strong>
        </div>

        <div className="orden-resumen-tarjeta">
          <span>Órdenes finalizadas</span>
          <strong>{ordenesFinalizadas.length}</strong>
        </div>
      </div>

      {error && (
        <div className="orden-mensaje orden-mensaje-error" role="alert">
          {error}
        </div>
      )}

      {mensaje && (
        <div className="orden-mensaje orden-mensaje-exito" role="status">
          {mensaje}
        </div>
      )}

      {mostrarFormulario && (
        <OrdenForm
  key={ordenEditar?.id ?? 'nueva'}
  activos={activos}
  ordenes={ordenes}
  esAdministrador={esAdministrador}
  orden={ordenEditar}
  onGuardar={guardarOrden}
  onCancelar={cerrarFormulario}
  cargando={cargandoFormulario}
/>
      )}

      {ordenAsignar && (
        <OrdenAsignar
          key={ordenAsignar.id}
          orden={ordenAsignar}
          usuarios={usuarios}
          onGuardar={guardarResponsables}
          onCancelar={() => setOrdenAsignar(null)}
          cargando={cargandoFormulario}
        />
      )}

      {ordenDetalle && (
        <OrdenDetalle
          orden={ordenDetalle}
          onCerrar={() => setOrdenDetalle(null)}
        />
      )}

      <div className="ordenes-listado">
        <div className="ordenes-listado-encabezado">
          <h2>Listado de órdenes</h2>

          <button
            type="button"
            className="orden-boton orden-boton-secundario"
            onClick={cargarOrdenes}
            disabled={cargando || accionandoId !== null}
          >
            {cargando ? 'Actualizando...' : 'Actualizar listado'}
          </button>
        </div>

        {cargando ? (
          <p className="orden-cargando">Cargando órdenes de trabajo...</p>
        ) : (
          <OrdenTable
            ordenes={ordenes}
            esAdministrador={esAdministrador}
            esMantenimiento={esMantenimiento}
            usuarioId={usuario?.id}
            onVerDetalle={verDetalle}
            onEditar={abrirFormularioEditar}
            onAsignar={(orden) => {
              setOrdenAsignar(orden)
              setOrdenDetalle(null)
              setMostrarFormulario(false)
              setError('')
              setMensaje('')
            }}
            onCambiarEstado={manejarCambioEstado}
            accionandoId={accionandoId}
          />
        )}
      </div>
    </section>
  )
}

export default Ordenes
