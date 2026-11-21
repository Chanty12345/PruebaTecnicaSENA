import api from './api'

// Obtener todas las órdenes de trabajo
export const listarOrdenes = async () => {
  const respuesta = await api.get('/ordenes')
  return respuesta.data.data
}

// Obtener una orden por su ID
export const obtenerOrdenPorId = async (id) => {
  const respuesta = await api.get(`/ordenes/${id}`)
  return respuesta.data.data
}

// Crear una orden de trabajo
export const crearOrden = async (datos) => {
  const respuesta = await api.post('/ordenes', datos)
  return respuesta.data
}

// Actualizar una orden
export const actualizarOrden = async (id, datos) => {
  const respuesta = await api.put(`/ordenes/${id}`, datos)
  return respuesta.data.data
}

// Asignar responsables a una orden
export const asignarResponsables = async (id, responsables) => {
  const respuesta = await api.put(`/ordenes/${id}/responsables`, {
    responsables
  })

  return respuesta.data.data
}

// Cambiar el estado de una orden
export const cambiarEstadoOrden = async (id, estado) => {
  const respuesta = await api.patch(`/ordenes/${id}/estado`, {
    estado
  })

  return respuesta.data.data
}

// Obtener usuarios para asignar responsables
export const listarUsuarios = async () => {
  const respuesta = await api.get('/auth/usuarios')
  return respuesta.data.data
}
