import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@bloom/react'

export default function ProtectedLayout() {
  const { isLoading, isSignedIn } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">loading...</div>
      </div>
    )
  }

  if (!isSignedIn) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
