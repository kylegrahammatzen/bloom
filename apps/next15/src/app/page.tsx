import { getSession } from '@bloom/core/server/nextjs';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoginForm } from '@/components/auth/login-form';
import { SignUpForm } from '@/components/auth/signup-form';
import { LogoutButton } from '@/components/auth/logout-button';
import { DeleteAccountDialog } from '@/components/auth/delete-account-dialog';

export default async function Home() {
  const { isSignedIn, user } = await getSession();

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
            <div className="flex gap-2 px-6 pb-6">
              <LogoutButton />
              <DeleteAccountDialog />
            </div>
          </Card>
        ) : (
          <Tabs defaultValue="login" className="w-96">
            <TabsList className="w-full">
              <TabsTrigger value="login" className="flex-1">Login</TabsTrigger>
              <TabsTrigger value="signup" className="flex-1">Sign up</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <LoginForm />
            </TabsContent>
            <TabsContent value="signup">
              <SignUpForm />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
