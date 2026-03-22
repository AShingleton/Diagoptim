"use client";

import { useParams } from "next/navigation";
import { createTranslator, defaultLocale, type Locale } from "@/i18n/config";

export function useTranslation() {
  const params = useParams();
  const locale = (params?.locale as Locale) || defaultLocale;
  const t = createTranslator(locale);
  return { t, locale };
}
