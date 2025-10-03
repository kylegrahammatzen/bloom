import { useNavigate, Link } from 'react-router'
import { useAuth } from '@bloom/react'
import { SignUpForm } from '@/components/auth/signup-form'
import { toastManager } from '@/hooks/use-toast'

export default function SignUp() {
  const navigate = useNavigate()
  const { signUp, refetch } = useAuth()

  const handleSubmit = async (body: { email: string; password: string }) => {
    const response = await signUp.email(body)

    if (response.error) {
      toastManager.add({
        title: "Sign up failed",
        description: response.error.message || "Please try again",
        type: "error",
      })
    } else {
      await refetch()
      toastManager.add({
        title: "Account created successfully",
        type: "success",
      })
      navigate('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full space-y-4">
        <SignUpForm onSubmit={handleSubmit} />
        <div className="text-sm text-center">
          <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            Already have an account? Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
