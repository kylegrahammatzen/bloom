import { VerifyEmailButton } from './verify-email-button';

type AccountVerificationProps = {
  email: string;
}

export const AccountVerification = (props: AccountVerificationProps) => {
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-2">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-yellow-800">Email not verified</p>
          <p className="text-xs text-yellow-700">
            Please verify your email address to access all features.
          </p>
        </div>
      </div>
      <VerifyEmailButton email={props.email} />
    </div>
  );
};
