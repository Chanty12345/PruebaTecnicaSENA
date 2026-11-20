
import { useState } from 'react'
import api from '../services/api'
import AuthContext from './AuthContext'

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    const usuarioGuardado = localStorage.getItem('usuario')

    return usuarioGuardado ? JSON.parse(usuarioGuardado) : null
  })

  const [cargando, setCargando] = useState(false)

  const iniciarSesion = async (email, password) => {
    setCargando(true)

    try {
      const respuesta = await api.post('/auth/login', {
        email,
        password
      })

      const { token, usuario: datosUsuario } = respuesta.data.data

      localStorage.setItem('token', token)
      localStorage.setItem('usuario', JSON.stringify(datosUsuario))

      setUsuario(datosUsuario)

      return { success: true }
    } catch (error) {
      return {
        success: false,
        message:
          error.response?.data?.message ||
          'No fue posible iniciar sesión. Intenta nuevamente.'
      }
    } finally {
      setCargando(false)
    }
  }

  const cerrarSesion = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
    setUsuario(null)
  }

  return (
    <AuthContext.Provider
      value={{
        usuario,
        cargando,
        iniciarSesion,
        cerrarSesion
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
