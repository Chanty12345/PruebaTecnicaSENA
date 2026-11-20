
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import '../styles/Login.css'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const { iniciarSesion, cargando } = useAuth()
  const navigate = useNavigate()

  const manejarEnvio = async (e) => {
    e.preventDefault()
    setError('')

    if (!email.trim() || !password) {
      setError('Ingresa tu correo y contraseña.')
      return
    }

    const resultado = await iniciarSesion(email, password)

    if (resultado.success) {
      navigate('/', { replace: true })
    } else {
      setError(resultado.message)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-brand">
          <div className="login-logo">O</div>
          <h1>ORION</h1>
          <p>Maintenance Lite</p>
        </div>

        <div className="login-heading">
          <h2>Bienvenido</h2>
          <p>Ingresa tus credenciales para continuar.</p>
        </div>

        <form onSubmit={manejarEnvio}>
          <label htmlFor="email">Correo electrónico</label>
          <input
            id="email"
            type="email"
            placeholder="usuario@orion.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            required
          />

          <label htmlFor="password">Contraseña</label>
          <input
            id="password"
            type="password"
            placeholder="Ingresa tu contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />

          {error && <div className="login-error">{error}</div>}

          <button type="submit" disabled={cargando}>
            {cargando ? 'Ingresando...' : 'Iniciar sesión'}
          </button>
        </form>

        <div className="login-footer">
          Sistema de gestión de mantenimiento
        </div>
      </div>
    </div>
  )
}

export default Login
