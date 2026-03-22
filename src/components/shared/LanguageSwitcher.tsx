"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";

const localeLabels: Record<string, string> = {
  fr: "FR",
  en: "EN",
};

export function LanguageSwitcher() {
  const { locale } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();

  function switchLocale(newLocale: string) {
    if (newLocale === locale) return;

    // Replace current locale prefix in path with new locale
    const segments = pathname.split("/");
    if (segments[1] === locale) {
      segments[1] = newLocale;
    }
    router.push(segments.join("/"));
  }

  return (
    <div className="flex items-center rounded-lg border border-border/50 overflow-hidden">
      {Object.entries(localeLabels).map(([code, label]) => {
        const isActive = code === locale;
        return (
          <button
            key={code}
            type="button"
            onClick={() => switchLocale(code)}
            className={cn(
              "px-2.5 py-1 text-xs font-semibold transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
