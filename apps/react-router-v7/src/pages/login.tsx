import { useNavigate, Link } from 'react-router'
import { useAuth } from '@bloom/react'
import { LoginForm } from '@/components/auth/login-form'
import { toastManager } from '@/hooks/use-toast'

export default function Login() {
  const navigate = useNavigate()
  const { signIn, refetch } = useAuth()

  const handleSubmit = async (body: { email: string; password: string }) => {
    const response = await signIn.email(body)

    if (response.error) {
      toastManager.add({
        title: "Login failed",
        description: response.error.message || "Please try again",
        type: "error",
      })
    } else {
      await refetch()
      toastManager.add({
        title: "Logged in successfully",
        type: "success",
      })
      navigate('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full space-y-4">
        <LoginForm onSubmit={handleSubmit} />
        <div className="text-sm text-center">
          <Link to="/signup" className="font-medium text-indigo-600 hover:text-indigo-500">
            Don't have an account? Sign up
          </Link>
        </div>
      </div>
    </div>
  )
}
