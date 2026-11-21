import api from './api'

// Obtener todos los activos
export const listarActivos = async () => {
  const respuesta = await api.get('/activos')
  return respuesta.data.data
}

// Obtener un activo por su ID
export const obtenerActivoPorId = async (id) => {
  const respuesta = await api.get(`/activos/${id}`)
  return respuesta.data.data
}

// Registrar un activo
export const crearActivo = async (datos) => {
  const respuesta = await api.post('/activos', datos)
  return respuesta.data.data
}

// Actualizar un activo
export const actualizarActivo = async (id, datos) => {
  const respuesta = await api.put(`/activos/${id}`, datos)
  return respuesta.data.data
}

// Desactivar un activo
export const desactivarActivo = async (id) => {
  const respuesta = await api.delete(`/activos/${id}`)
  return respuesta.data.data
}

// Reactivar un activo
export const reactivarActivo = async (id) => {
  const respuesta = await api.patch(`/activos/${id}/reactivar`)
  return respuesta.data.data
}