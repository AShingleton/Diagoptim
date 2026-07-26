import type { Metadata } from "next";
import { DM_Sans, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import "../globals.css";
import { QueryProvider } from "./QueryProvider";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  display: "swap",
  weight: ["600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: {
    default: "DiagOptim",
    template: "%s | DiagOptim",
  },
  description:
    "Diagnostiquez et optimisez votre entreprise avec le Lean Management. Identifiez vos gaspillages, generez un plan d'action personnalise et atteignez l'excellence operationnelle.",
  keywords: [
    "diagnostic entreprise",
    "lean management",
    "optimisation",
    "amelioration continue",
  ],
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Dynamically load PostHogProvider only when the key is configured.
  // This keeps posthog-js completely out of the client bundle otherwise.
  let MaybePostHogProvider: React.ComponentType<{ children: React.ReactNode }> | null = null;
  const phKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (phKey && !phKey.endsWith("...") && phKey.length >= 10) {
    const mod = await import("@/components/providers/PostHogProvider");
    MaybePostHogProvider = mod.PostHogProvider;
  }

  const appContent = (
    <QueryProvider>
      {children}
      <Toaster
        position="top-right"
        richColors
        closeButton
        toastOptions={{
          duration: 4000,
        }}
      />
    </QueryProvider>
  );

  return (
    <html
      lang={locale}
      className={`${dmSans.variable} ${plusJakarta.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {MaybePostHogProvider ? (
            <MaybePostHogProvider>{appContent}</MaybePostHogProvider>
          ) : (
            appContent
          )}
        </ThemeProvider>
      </body>
    </html>
  );
}
