import { Suspense } from "react";
import { PasswordResetPage } from "@/components/features/auth/password-reset-page";

export default function Page() {
  return (
    <Suspense>
      <PasswordResetPage />
    </Suspense>
  );
}
