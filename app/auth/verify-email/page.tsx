import { Suspense } from "react";
import { EmailVerificationPage } from "@/components/features/auth/email-verification-page";

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <EmailVerificationPage />
    </Suspense>
  );
}
