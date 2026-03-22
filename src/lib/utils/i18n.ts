import type { Locale } from "@/i18n/config";
import { createTranslator, defaultLocale, locales } from "@/i18n/config";

/**
 * Detects the preferred locale from HTTP request headers.
 * Parses the Accept-Language header and returns the best matching
 * supported locale, falling back to the default locale.
 *
 * @param headers - The HTTP request Headers object
 * @returns The matched locale ('fr' or 'en')
 */
export function getLocale(headers: Headers): Locale {
  const acceptLanguage = headers.get("accept-language");

  if (!acceptLanguage) {
    return defaultLocale;
  }

  // Parse Accept-Language header entries with quality values
  const parsed = acceptLanguage
    .split(",")
    .map((entry) => {
      const parts = entry.trim().split(";");
      const lang = parts[0]?.trim().toLowerCase() ?? "";
      const qualityMatch = parts[1]?.match(/q\s*=\s*([\d.]+)/);
      const quality = qualityMatch ? parseFloat(qualityMatch[1]) : 1.0;
      return { lang, quality };
    })
    .filter((entry) => !isNaN(entry.quality))
    .sort((a, b) => b.quality - a.quality);

  // Match against supported locales
  for (const entry of parsed) {
    const langPrefix = entry.lang.split("-")[0];

    // Exact match
    const exactMatch = locales.find((l) => l === entry.lang);
    if (exactMatch) return exactMatch;

    // Prefix match (e.g., "fr-FR" matches "fr")
    const prefixMatch = locales.find((l) => l === langPrefix);
    if (prefixMatch) return prefixMatch;
  }

  return defaultLocale;
}

/**
 * Server-side translation function.
 * Wraps the i18n config's createTranslator for use in API routes
 * and server components.
 *
 * @param key - The dot-notation translation key (e.g., "pricing.free")
 * @param locale - The target locale
 * @param params - Optional interpolation parameters
 * @returns The translated string with parameters applied
 */
export function t(
  key: string,
  locale: Locale,
  params?: Record<string, string>
): string {
  const translator = createTranslator(locale);
  return translator(key, params);
}

/**
 * Formats a numeric amount as a localized currency string.
 * Defaults to EUR for French locale, USD for English.
 *
 * @param amount - The numeric amount to format
 * @param locale - The target locale for formatting
 * @returns A formatted currency string (e.g., "1 234,56 EUR" or "$1,234.56")
 */
export function formatCurrency(amount: number, locale: Locale): string {
  const intlLocale = locale === "fr" ? "fr-FR" : "en-US";
  const currency = locale === "fr" ? "EUR" : "USD";

  return new Intl.NumberFormat(intlLocale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formats a Date object as a localized date string.
 *
 * @param date - The Date to format
 * @param locale - The target locale
 * @returns A formatted date string (e.g., "21 mars 2026" or "March 21, 2026")
 */
export function formatDate(date: Date, locale: Locale): string {
  const intlLocale = locale === "fr" ? "fr-FR" : "en-US";

  return new Intl.DateTimeFormat(intlLocale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

/**
 * Formats a number with locale-appropriate grouping and decimal separators.
 *
 * @param num - The number to format
 * @param locale - The target locale
 * @returns A formatted number string (e.g., "1 234,56" or "1,234.56")
 */
export function formatNumber(num: number, locale: Locale): string {
  const intlLocale = locale === "fr" ? "fr-FR" : "en-US";

  return new Intl.NumberFormat(intlLocale).format(num);
}
