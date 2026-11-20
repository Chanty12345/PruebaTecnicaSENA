
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

function ProtectedRoute({ children }) {
  const { usuario } = useAuth()

  if (!usuario || !localStorage.getItem('token')) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default ProtectedRoute
