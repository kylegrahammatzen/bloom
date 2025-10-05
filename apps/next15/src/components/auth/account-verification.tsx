import { AlertTriangle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { VerifyEmailButton } from './verify-email-button';

type AccountVerificationProps = {
  email: string;
}

export const AccountVerification = (props: AccountVerificationProps) => {
  return (
    <Alert variant="danger" className="max-w-3xl">
      <AlertTriangle />
      <AlertTitle>Email not verified</AlertTitle>
      <AlertDescription>
        Please verify your email address to access all features.
        <VerifyEmailButton email={props.email} />
      </AlertDescription>
    </Alert>
  );
};
