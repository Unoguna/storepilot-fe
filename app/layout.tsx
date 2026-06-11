import type { Metadata } from "next";
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
      <body>{children}</body>
    </html>
  );
}
