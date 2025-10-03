import { useEffect, useState } from 'react'
import { useAuth } from '@bloom/react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toastManager } from '@/hooks/use-toast'
import { SignUpForm } from '@/components/auth/signup-form'
import { LoginForm } from '@/components/auth/login-form'
import { DeleteAccountDialog } from '@/components/auth/delete-account-dialog'
import { config } from '@/config'

export default function Home() {
  const [status, setStatus] = useState<string>("Checking...")
  const [data, setData] = useState<any>(null)
  const { isSignedIn, user, signIn, signUp, signOut, deleteAccount, refetch } = useAuth()

  useEffect(() => {
    fetch(`${config.apiUrl}/api/health`)
      .then(res => res.ok ? res.json().then(data => (setStatus("Connected"), setData(data))) : (setStatus("Disconnected"), setData({ error: "Failed" })))
      .catch(error => (setStatus("Disconnected"), setData({ error: String(error) })))
  }, [])

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

      <div className="space-y-2">
        <div>
          <span>API Status: {status}</span>
          {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
        </div>
        <div>
          <span>Auth Status: {isSignedIn ? "Signed In" : "Signed Out"}</span>
          {user && <pre>{JSON.stringify(user, null, 2)}</pre>}
        </div>
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
              <LoginForm onSubmit={handleAuth(signIn.email, "Logged in successfully")} />
            </TabsContent>
            <TabsContent value="signup">
              <SignUpForm onSubmit={handleAuth(signUp.email, "Account created successfully")} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  )
}
