"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { useUIStore } from "@/stores/uiStore";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import {
  Activity,
  Menu,
  X,
  Bell,
  Search,
  Moon,
  Sun,
  Globe,
  User,
} from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Header for the app area
// ---------------------------------------------------------------------------

function AppHeader() {
  const { t, locale } = useTranslation();
  const { theme, setTheme } = useTheme();
  const mobileNavOpen = useUIStore((s) => s.mobileNavOpen);
  const setMobileNavOpen = useUIStore((s) => s.setMobileNavOpen);
  const otherLocale = locale === "fr" ? "en" : "fr";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border/50 bg-background/80 backdrop-blur-lg px-4 lg:px-6">
      {/* Mobile menu toggle */}
      <button
        className="lg:hidden p-2 -ml-2"
        onClick={() => setMobileNavOpen(!mobileNavOpen)}
        aria-label="Toggle navigation"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Search bar placeholder */}
      <div className="hidden sm:flex flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={t("common.search") + "..."}
            className="h-9 w-full rounded-lg border border-input bg-muted/30 pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30"
          />
        </div>
      </div>

      <div className="flex-1 sm:flex-none" />

      {/* Right side actions */}
      <div className="flex items-center gap-2">
        {/* Language */}
        <Link
          href={`/${otherLocale}/dashboard`}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors px-2"
        >
          <Globe className="w-4 h-4" />
          <span className="hidden sm:inline">{otherLocale.toUpperCase()}</span>
        </Link>

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="Toggle theme"
        >
          <Sun className="w-4 h-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute w-4 h-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="w-4 h-4" />
        </Button>

        {/* User avatar */}
        <Button variant="ghost" size="icon" className="rounded-full" aria-label="Profile">
          <User className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
}

// ---------------------------------------------------------------------------
// Mobile navigation overlay
// ---------------------------------------------------------------------------

function MobileNav() {
  const { t, locale } = useTranslation();
  const pathname = usePathname();
  const mobileNavOpen = useUIStore((s) => s.mobileNavOpen);
  const setMobileNavOpen = useUIStore((s) => s.setMobileNavOpen);

  const navItems = [
    { label: t("nav.dashboard"), href: `/${locale}/dashboard` },
    { label: t("nav.diagnostic"), href: `/${locale}/dashboard/diagnostic` },
    { label: t("nav.roadmap"), href: `/${locale}/dashboard/roadmap` },
    { label: t("nav.tools"), href: `/${locale}/dashboard/tools` },
    { label: t("nav.training"), href: `/${locale}/dashboard/training` },
    { label: t("nav.documents"), href: `/${locale}/dashboard/documents` },
    { label: t("nav.reports"), href: `/${locale}/dashboard/reports` },
    { label: t("nav.settings"), href: `/${locale}/dashboard/settings` },
    { label: t("nav.support"), href: `/${locale}/dashboard/support` },
  ];

  return (
    <AnimatePresence>
      {mobileNavOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setMobileNavOpen(false)}
          />

          {/* Drawer */}
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ duration: 0.25, ease: "easeOut" as const }}
            className="fixed inset-y-0 left-0 z-50 w-[280px] bg-background border-r border-border/50 lg:hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between h-16 px-4 border-b border-border/50">
              <Link
                href={`/${locale}/dashboard`}
                className="flex items-center gap-2.5"
                onClick={() => setMobileNavOpen(false)}
              >
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary text-primary-foreground">
                  <Activity className="w-5 h-5" />
                </div>
                <span className="text-lg font-bold tracking-tight">
                  DiagOptim
                </span>
              </Link>
              <button
                onClick={() => setMobileNavOpen(false)}
                className="p-2"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Nav items */}
            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
              {navItems.map((item) => {
                const isActive =
                  item.href === `/${locale}/dashboard`
                    ? pathname === item.href
                    : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileNavOpen(false)}
                    className={cn(
                      "flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      "hover:bg-muted",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

// ---------------------------------------------------------------------------
// App Layout
// ---------------------------------------------------------------------------

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);

  return (
    <div className="relative min-h-screen bg-background">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Mobile nav */}
      <MobileNav />

      {/* Main content area - offset by sidebar width */}
      <div
        className={cn(
          "transition-[margin] duration-250 ease-in-out",
          "lg:ml-[280px]",
          !sidebarOpen && "lg:ml-[72px]"
        )}
      >
        <AppHeader />
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
