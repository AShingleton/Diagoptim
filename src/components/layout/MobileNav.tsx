"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Activity,
  LayoutDashboard,
  ClipboardCheck,
  Map,
  Wrench,
  GraduationCap,
  FileText,
  BarChart3,
  Settings,
  HelpCircle,
  MoreHorizontal,
} from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useUIStore } from "@/stores/uiStore";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface NavItem {
  labelKey: string;
  href: string;
  icon: React.ElementType;
}

export function MobileNav() {
  const { t, locale } = useTranslation();
  const pathname = usePathname();
  const mobileNavOpen = useUIStore((s) => s.mobileNavOpen);
  const setMobileNavOpen = useUIStore((s) => s.setMobileNavOpen);

  const allNavItems: NavItem[] = [
    {
      labelKey: "nav.dashboard",
      href: `/${locale}/dashboard`,
      icon: LayoutDashboard,
    },
    {
      labelKey: "nav.diagnostic",
      href: `/${locale}/dashboard/diagnostic`,
      icon: ClipboardCheck,
    },
    {
      labelKey: "nav.roadmap",
      href: `/${locale}/dashboard/roadmap`,
      icon: Map,
    },
    {
      labelKey: "nav.tools",
      href: `/${locale}/dashboard/tools`,
      icon: Wrench,
    },
    {
      labelKey: "nav.training",
      href: `/${locale}/dashboard/training`,
      icon: GraduationCap,
    },
    {
      labelKey: "nav.documents",
      href: `/${locale}/dashboard/documents`,
      icon: FileText,
    },
    {
      labelKey: "nav.reports",
      href: `/${locale}/dashboard/reports`,
      icon: BarChart3,
    },
  ];

  const bottomNavItems: NavItem[] = [
    {
      labelKey: "nav.settings",
      href: `/${locale}/dashboard/settings`,
      icon: Settings,
    },
    {
      labelKey: "nav.support",
      href: `/${locale}/dashboard/support`,
      icon: HelpCircle,
    },
  ];

  // Bottom tab bar items: first 4 main nav + "More" toggle
  const tabBarItems = allNavItems.slice(0, 4);

  function isActive(href: string): boolean {
    if (href === `/${locale}/dashboard`) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  }

  const isMoreActive = allNavItems
    .slice(4)
    .concat(bottomNavItems)
    .some((item) => isActive(item.href));

  return (
    <>
      {/* Sheet navigation (slides from left) */}
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="w-[280px] p-0">
          <SheetHeader className="flex flex-row items-center gap-3 h-16 px-4 border-b border-border/50">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary text-primary-foreground">
              <Activity className="w-5 h-5" />
            </div>
            <SheetTitle className="text-lg font-bold tracking-tight">
              DiagOptim
            </SheetTitle>
          </SheetHeader>

          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
            {allNavItems.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileNavOpen(false)}
                  className={cn(
                    "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    "hover:bg-muted",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {active && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-primary" />
                  )}
                  <Icon className="w-5 h-5 shrink-0" />
                  <span>{t(item.labelKey)}</span>
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-border/50 py-4 px-3 space-y-1">
            {bottomNavItems.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileNavOpen(false)}
                  className={cn(
                    "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    "hover:bg-muted",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {active && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-primary" />
                  )}
                  <Icon className="w-5 h-5 shrink-0" />
                  <span>{t(item.labelKey)}</span>
                </Link>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>

      {/* Bottom tab bar (mobile only) */}
      <nav
        className={cn(
          "fixed bottom-0 left-0 right-0 z-40 lg:hidden",
          "flex items-center justify-around h-16 px-2",
          "bg-white/90 dark:bg-card/90 backdrop-blur-md",
          "border-t border-border/50",
          "safe-area-inset-bottom"
        )}
      >
        {tabBarItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center flex-1 h-full gap-0.5 relative"
            >
              {active && (
                <motion.div
                  layoutId="mobile-tab-indicator"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] rounded-b-full bg-primary"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
              <Icon
                className={cn(
                  "w-5 h-5 transition-colors",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              />
              <span
                className={cn(
                  "text-[10px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                {t(item.labelKey)}
              </span>
            </Link>
          );
        })}

        {/* More button */}
        <button
          type="button"
          onClick={() => setMobileNavOpen(true)}
          className="flex flex-col items-center justify-center flex-1 h-full gap-0.5 relative"
        >
          {isMoreActive && (
            <motion.div
              layoutId="mobile-tab-indicator"
              className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] rounded-b-full bg-primary"
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
            />
          )}
          <MoreHorizontal
            className={cn(
              "w-5 h-5 transition-colors",
              isMoreActive ? "text-primary" : "text-muted-foreground"
            )}
          />
          <span
            className={cn(
              "text-[10px] font-medium transition-colors",
              isMoreActive ? "text-primary" : "text-muted-foreground"
            )}
          >
            {t("nav.more")}
          </span>
        </button>
      </nav>
    </>
  );
}
