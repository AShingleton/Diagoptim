import fr from "./fr.json";
import en from "./en.json";

export const locales = ["fr", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "fr";

const translations: Record<Locale, typeof fr> = { fr, en };

function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const keys = path.split(".");
  let current: unknown = obj;
  for (const key of keys) {
    if (current && typeof current === "object" && key in current) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return path;
    }
  }
  return typeof current === "string" ? current : path;
}

export function createTranslator(locale: Locale) {
  const dict = translations[locale] || translations[defaultLocale];

  function t(key: string, params?: Record<string, string | number>): string {
    let value = getNestedValue(dict as unknown as Record<string, unknown>, key);
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        value = value.replace(`{${k}}`, String(v));
      });
    }
    return value;
  }

  return t;
}

export type TranslatorFn = ReturnType<typeof createTranslator>;
