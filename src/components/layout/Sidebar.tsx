"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useUIStore } from "@/stores/uiStore";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

interface NavItem {
  labelKey: string;
  href: string;
  icon: React.ElementType;
}

const sidebarVariants = {
  expanded: { width: 280 },
  collapsed: { width: 72 },
};

const labelVariants = {
  show: { opacity: 1, x: 0, display: "block" },
  hide: { opacity: 0, x: -8, transitionEnd: { display: "none" } },
};

export function Sidebar() {
  const { t, locale } = useTranslation();
  const pathname = usePathname();
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);

  const mainNavItems: NavItem[] = useMemo(
    () => [
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
    ],
    [locale]
  );

  const bottomNavItems: NavItem[] = useMemo(
    () => [
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
    ],
    [locale]
  );

  function isActive(href: string): boolean {
    if (href === `/${locale}/dashboard`) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  }

  return (
    <motion.aside
      initial={false}
      animate={sidebarOpen ? "expanded" : "collapsed"}
      variants={sidebarVariants}
      transition={{ duration: 0.25, ease: "easeInOut" as const }}
      className={cn(
        "hidden lg:flex flex-col fixed left-0 top-0 bottom-0 z-40",
        "bg-white/90 dark:bg-card/90 backdrop-blur-md",
        "border-r border-border/50"
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-border/50">
        <Link
          href={`/${locale}/dashboard`}
          className="flex items-center gap-3 min-w-0"
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-primary-foreground shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <AnimatePresence initial={false}>
            {sidebarOpen && (
              <motion.span
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.15 }}
                className="text-lg font-bold tracking-tight truncate"
              >
                DiagOptim
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        <TooltipProvider>
          {mainNavItems.map((item) => {
            const active = isActive(item.href);
            return (
              <NavLink
                key={item.href}
                item={item}
                active={active}
                expanded={sidebarOpen}
                t={t}
              />
            );
          })}
        </TooltipProvider>
      </nav>

      {/* Bottom Navigation */}
      <div className="border-t border-border/50 py-4 px-3 space-y-1">
        <TooltipProvider>
          {bottomNavItems.map((item) => {
            const active = isActive(item.href);
            return (
              <NavLink
                key={item.href}
                item={item}
                active={active}
                expanded={sidebarOpen}
                t={t}
              />
            );
          })}
        </TooltipProvider>

        {/* Collapse Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className={cn(
            "w-full mt-2",
            sidebarOpen ? "justify-start px-3" : "justify-center px-0"
          )}
        >
          {sidebarOpen ? (
            <ChevronsLeft className="w-4 h-4 shrink-0" />
          ) : (
            <ChevronsRight className="w-4 h-4 shrink-0" />
          )}
          <AnimatePresence initial={false}>
            {sidebarOpen && (
              <motion.span
                variants={labelVariants}
                initial="hide"
                animate="show"
                exit="hide"
                transition={{ duration: 0.15 }}
                className="ml-3 text-sm"
              >
                {t("nav.collapse")}
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </div>
    </motion.aside>
  );
}

function NavLink({
  item,
  active,
  expanded,
  t,
}: {
  item: NavItem;
  active: boolean;
  expanded: boolean;
  t: (key: string) => string;
}) {
  const Icon = item.icon;

  const linkContent = (
    <Link
      href={item.href}
      className={cn(
        "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150",
        "hover:bg-muted",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:text-foreground",
        !expanded && "justify-center px-0"
      )}
    >
      {/* Active indicator bar */}
      {active && (
        <motion.div
          layoutId="sidebar-active-indicator"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-primary"
          transition={{ type: "spring", stiffness: 350, damping: 30 }}
        />
      )}

      <Icon className="w-5 h-5 shrink-0" />

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.span
            variants={labelVariants}
            initial="hide"
            animate="show"
            exit="hide"
            transition={{ duration: 0.15 }}
            className="truncate"
          >
            {t(item.labelKey)}
          </motion.span>
        )}
      </AnimatePresence>
    </Link>
  );

  if (!expanded) {
    return (
      <Tooltip>
        <TooltipTrigger render={<div />}>{linkContent}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          {t(item.labelKey)}
        </TooltipContent>
      </Tooltip>
    );
  }

  return linkContent;
}
