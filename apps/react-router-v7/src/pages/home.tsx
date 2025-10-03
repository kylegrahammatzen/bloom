import { useAuth } from '@bloom/react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toastManager } from '@/hooks/use-toast'
import { SignUpForm } from '@/components/auth/signup-form'
import { LoginForm } from '@/components/auth/login-form'
import { DeleteAccountDialog } from '@/components/auth/delete-account-dialog'

export default function Home() {
  const { isSignedIn, user, signIn, signUp, signOut, deleteAccount, refetch } = useAuth()

  const handleAuth = (fn: any, success: string) => async (body?: any) => {
    const res = await fn(body)
    await refetch()
    toastManager.add({ title: res.error ? res.error.message : success, type: res.error ? "error" : "success" })
  }

  return (
    <div className="p-4 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Bloom</h1>
        <p>An open-source project to show how authentication really works</p>
      </div>

      <div>
        {isSignedIn ? (
          <Card>
            <CardHeader>
              <CardTitle>Logged in as: {user?.email}</CardTitle>
            </CardHeader>
            <div className="flex gap-2 px-6">
              <Button onClick={handleAuth(signOut, "Logged out successfully")}>Logout</Button>
              <DeleteAccountDialog onConfirm={handleAuth(deleteAccount, "Account deleted successfully")} />
            </div>
          </Card>
        ) : (
          <Tabs defaultValue="login" className="w-96">
            <TabsList>
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign up</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <LoginForm onSubmit={handleAuth(signIn, "Logged in successfully")} />
            </TabsContent>
            <TabsContent value="signup">
              <SignUpForm onSubmit={handleAuth(signUp, "Account created successfully")} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  )
}
