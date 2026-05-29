/**
 * Lightweight i18n layer (no runtime dependency).
 *
 * - `t(key, params)` looks a string up in the active locale, falling back
 *   to English for any missing key, and interpolates `{name}` tokens.
 * - The context default is the English translator, so components render
 *   correctly even without a provider (keeps unit tests provider-free).
 * - `I18nProvider` owns the active locale: it persists the choice to
 *   localStorage and mirrors it onto `<html lang>` for a11y.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { en, type TranslationKey } from "./locales/en";
import { ru } from "./locales/ru";

export type Locale = "en" | "ru";

export const LOCALES: Locale[] = ["en", "ru"];
const STORAGE_KEY = "satellitesnap.lang";
const DICTS: Record<Locale, Record<TranslationKey, string>> = { en, ru };

export type TFn = (
  key: TranslationKey,
  params?: Record<string, string | number>,
) => string;

/** Pure lookup + interpolation. Exported for direct use in tests. */
export function translate(
  locale: Locale,
  key: TranslationKey,
  params?: Record<string, string | number>,
): string {
  const dict = DICTS[locale] ?? en;
  let out: string = dict[key] ?? en[key] ?? key;
  if (params) {
    for (const [name, value] of Object.entries(params)) {
      out = out.replace(new RegExp(`\\{${name}\\}`, "g"), String(value));
    }
  }
  return out;
}

/** Resolve the initial locale: saved choice → browser language → English. */
export function detectInitialLocale(): Locale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "en" || saved === "ru") return saved;
  } catch {
    /* localStorage may be unavailable (private mode) */
  }
  const nav =
    typeof navigator !== "undefined" ? navigator.language?.toLowerCase() : "";
  return nav?.startsWith("ru") ? "ru" : "en";
}

interface I18nValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: TFn;
}

const I18nContext = createContext<I18nValue>({
  locale: "en",
  setLocale: () => {},
  t: (key, params) => translate("en", key, params),
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(detectInitialLocale);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
    }
    try {
      localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      /* ignore persistence failures */
    }
  }, [locale]);

  const t = useCallback<TFn>((key, params) => translate(locale, key, params), [
    locale,
  ]);

  const value = useMemo<I18nValue>(
    () => ({ locale, setLocale, t }),
    [locale, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  return useContext(I18nContext);
}

export type { TranslationKey };
