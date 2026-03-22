import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DiagOptim",
  description: "Diagnostic et optimisation Lean Management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
