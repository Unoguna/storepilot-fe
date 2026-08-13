import type { Metadata } from "next";
import { AuthSessionProvider } from "@/components/features/auth/auth-session-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "StorePilot",
  description: "Excel keyword generation tool",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <AuthSessionProvider>{children}</AuthSessionProvider>
      </body>
    </html>
  );
}
