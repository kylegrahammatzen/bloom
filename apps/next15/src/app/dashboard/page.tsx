import { getBloomSession } from '@bloom/adapters/nextjs';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const { user, isSignedIn } = await getBloomSession();

  if (!isSignedIn) {
    redirect('/');
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold">Dashboard (Server Component)</h1>
      <p className="mt-2 text-gray-600">This page uses server-side session validation with getBloomSession()</p>

      <div className="mt-8 p-4 border border-gray-300 rounded-lg">
        <h2 className="text-2xl font-semibold">User Information</h2>
        <p className="mt-2"><strong>Email:</strong> {user?.email}</p>
        <p><strong>User ID:</strong> {user?.id}</p>
        <p><strong>Email Verified:</strong> {user?.email_verified ? 'Yes' : 'No'}</p>
        <p><strong>Account Created:</strong> {user?.created_at ? new Date(user.created_at).toLocaleString() : 'N/A'}</p>
      </div>

      <div className="mt-4">
        <a
          href="/"
          className="px-4 py-2 bg-blue-600 text-white no-underline rounded inline-block"
        >
          Back to Home
        </a>
      </div>
    </div>
  );
}
