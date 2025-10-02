import { Link } from 'react-router-dom'
import { useAuth } from '@bloom/react'

export default function Home() {
  const { isSignedIn, user, signOut } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="space-y-4 w-48">
        {isSignedIn ? (
          <>
            <p className="text-sm text-gray-600">Signed in as {user?.email}</p>
            <Link
              to="/dashboard"
              className="block py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Dashboard
            </Link>
            <button
              onClick={() => signOut()}
              className="block w-full py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Sign out
            </button>
          </>
        ) : (
          <>
            <Link
              to="/login"
              className="block py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Sign in
            </Link>
            <Link
              to="/signup"
              className="block py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Sign up
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
