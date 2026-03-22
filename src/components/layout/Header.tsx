"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Menu,
  Search,
  Bell,
  LogOut,
  User,
  Settings,
  CreditCard,
} from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useUIStore } from "@/stores/uiStore";
import { useUserStore } from "@/stores/userStore";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";

export function Header() {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const setMobileNavOpen = useUIStore((s) => s.setMobileNavOpen);
  const user = useUserStore((s) => s.user);
  const logout = useUserStore((s) => s.logout);
  const [notificationCount] = useState(3);

  function getUserInitials(): string {
    if (!user?.fullName) return "U";
    const parts = user.fullName.split(" ");
    return parts
      .slice(0, 2)
      .map((p) => p[0])
      .join("")
      .toUpperCase();
  }

  function handleLogout() {
    logout();
    router.push(`/${locale}/login`);
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-50 flex items-center h-16 px-4 lg:px-6",
        "bg-white/80 dark:bg-card/80 backdrop-blur-md",
        "border-b border-border/50"
      )}
    >
      {/* Mobile hamburger */}
      <Button
        variant="ghost"
        size="sm"
        className="lg:hidden mr-2"
        onClick={() => setMobileNavOpen(true)}
      >
        <Menu className="w-5 h-5" />
        <span className="sr-only">{t("nav.openMenu")}</span>
      </Button>

      {/* Search bar */}
      <div className="flex-1 max-w-md">
        <button
          type="button"
          className={cn(
            "flex items-center gap-2 w-full h-9 px-3 rounded-lg",
            "bg-muted/50 hover:bg-muted transition-colors",
            "text-sm text-muted-foreground"
          )}
        >
          <Search className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">{t("header.search")}</span>
          <kbd className="hidden md:inline-flex ml-auto h-5 items-center gap-1 rounded border border-border bg-background px-1.5 text-[10px] font-medium text-muted-foreground">
            <span className="text-xs">&#8984;</span>K
          </kbd>
        </button>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1 sm:gap-2 ml-4">
        {/* Notifications */}
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="w-5 h-5" />
          {notificationCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold">
              {notificationCount}
            </span>
          )}
          <span className="sr-only">{t("header.notifications")}</span>
        </Button>

        {/* Theme toggle */}
        <ThemeToggle />

        {/* Language switcher */}
        <LanguageSwitcher />

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-muted transition-colors cursor-pointer"
          >
            <Avatar size="sm">
              {user?.avatarUrl && <AvatarImage src={user.avatarUrl} />}
              <AvatarFallback>{getUserInitials()}</AvatarFallback>
            </Avatar>
            <span className="hidden md:block text-sm font-medium max-w-[120px] truncate">
              {user?.fullName || t("header.guest")}
            </span>
          </DropdownMenuTrigger>

          <DropdownMenuContent side="bottom" align="end" sideOffset={8} className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="text-sm font-medium">
                  {user?.fullName || t("header.guest")}
                </span>
                <span className="text-xs text-muted-foreground">
                  {user?.email || ""}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => router.push(`/${locale}/dashboard/profile`)}
            >
              <User className="w-4 h-4 mr-2" />
              {t("header.profile")}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => router.push(`/${locale}/dashboard/settings`)}
            >
              <Settings className="w-4 h-4 mr-2" />
              {t("header.settings")}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => router.push(`/${locale}/dashboard/billing`)}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              {t("header.billing")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer text-destructive focus:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              {t("header.logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
