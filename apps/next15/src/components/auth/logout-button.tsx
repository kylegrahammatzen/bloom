'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@bloom/react';
import { Button } from '@/components/ui/button';
import { toastManager } from '@/hooks/use-toast';

export const LogoutButton = () => {
  const router = useRouter();
  const { signOut, refetch } = useAuth();

  const handleLogout = async () => {
    const res = await signOut();
    await refetch();
    router.refresh();
    toastManager.add({
      title: res.error ? res.error.message : 'Logged out successfully',
      type: res.error ? 'error' : 'success',
    });
  };

  return <Button onClick={handleLogout}>Logout</Button>;
};
