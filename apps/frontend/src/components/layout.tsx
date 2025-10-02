import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@bloom/react'
import { useState, useEffect } from 'react'
import { config } from '../config'

export function PublicLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Outlet />
    </div>
  )
}

export function ProtectedLayout() {
  const { isLoading, isSignedIn, user } = useAuth()
  const [apiStatus, setApiStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking')

  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        const response = await fetch(`${config.apiUrl}/health`, { method: 'GET' })
        setApiStatus(response.ok ? 'connected' : 'disconnected')
      } catch {
        setApiStatus('disconnected')
      }
    }
    checkApiStatus()
    const interval = setInterval(checkApiStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!isSignedIn) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center space-x-6 text-xs">
            <div>
              <span className="text-gray-500">api status</span>
              <span className={`ml-2 ${
                apiStatus === 'connected' ? 'text-green-600' :
                apiStatus === 'disconnected' ? 'text-red-600' :
                'text-yellow-600'
              }`}>
                {apiStatus === 'connected' ? 'connected' :
                 apiStatus === 'disconnected' ? 'disconnected' :
                 'checking'}
              </span>
            </div>
            <div>
              <span className="text-gray-500">auth status</span>
              <span className="ml-2 text-green-600">
                authenticated as {user?.email}
              </span>
            </div>
          </div>
        </div>
      </div>
      <Outlet />
    </div>
  )
}
