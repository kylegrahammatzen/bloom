import { getSession } from '@bloom/adapters/nextjs/server';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { LoginForm } from '@/components/auth/login-form';
import { SignUpForm } from '@/components/auth/signup-form';
import { LogoutButton } from '@/components/auth/logout-button';
import { DeleteAccountDialog } from '@/components/auth/delete-account-dialog';
import { AccountSessions } from '@/components/auth/account-sessions';
import { AccountVerification } from '@/components/auth/account-verification';
import { AccountSubscription } from '@/components/auth/account-subscription';

export default async function Home() {
  const validated = await getSession();

  return (
    <div className="p-4 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Bloom</h1>
        <p>An open-source project to show how authentication really works</p>
      </div>

      {validated ? (
        <div className="space-y-4">
          {!validated.user.email_verified && (
            <AccountVerification />
          )}

          <div>
            <div className="flex items-center gap-2 mb-2">
              <p className="text-sm font-medium">
                Logged in as {validated.user.email}
              </p>
              {validated.user.email_verified && (
                <Badge variant="success">Verified</Badge>
              )}
            </div>
            <div className="flex gap-2">
              <LogoutButton />
              <DeleteAccountDialog />
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold">Active Sessions</h2>
            <AccountSessions />
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold">Subscription</h2>
            <AccountSubscription />
          </div>
        </div>
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
  );
}
