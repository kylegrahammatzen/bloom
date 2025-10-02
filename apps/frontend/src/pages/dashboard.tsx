import { useNavigate } from 'react-router-dom'
import { useAuth } from '@bloom/react'

export default function Dashboard() {
  const { user, signOut, refetch, deleteAccount } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    await refetch()
    navigate('/login')
  }

  const handleDeleteAccount = async () => {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      await deleteAccount()
      await refetch()
      navigate('/login')
    }
  }

  return (
    <main className="p-8">
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Welcome, {user?.email}
          </h3>
          <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="mt-1 text-sm text-gray-900">{user?.email}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Email Verified</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {user?.email_verified ? 'Yes' : 'No'}
              </dd>
            </div>
            {user?.name && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Name</dt>
                <dd className="mt-1 text-sm text-gray-900">{user.name}</dd>
              </div>
            )}
            <div>
              <dt className="text-sm font-medium text-gray-500">Account Created</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(user?.created_at || '').toLocaleDateString()}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="mt-6 flex space-x-4">
        <button
          onClick={handleDeleteAccount}
          className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Delete Account
        </button>
        <button
          onClick={handleSignOut}
          className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          Sign out
        </button>
      </div>
    </main>
  )
}
