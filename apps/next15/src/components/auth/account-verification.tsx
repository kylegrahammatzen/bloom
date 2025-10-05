import { AlertTriangle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { VerifyEmailButton } from './verify-email-button';

export const AccountVerification = () => {
  return (
    <Alert variant="danger" className="max-w-3xl">
      <AlertTriangle />
      <AlertTitle>Email not verified</AlertTitle>
      <AlertDescription>
        Please verify your email address to access all features.
        <VerifyEmailButton />
      </AlertDescription>
    </Alert>
  );
};
