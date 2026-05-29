import { LOCALES, useI18n, type Locale } from "../i18n";

/** EN / RU segmented toggle. Reflects and sets the active locale. */
export default function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();

  return (
    <div
      className="lang-switch"
      role="group"
      aria-label={t("lang.label")}
    >
      {LOCALES.map((loc: Locale) => (
        <button
          key={loc}
          type="button"
          className={`lang-switch__btn${loc === locale ? " is-active" : ""}`}
          aria-pressed={loc === locale}
          onClick={() => setLocale(loc)}
        >
          {t(loc === "en" ? "lang.en" : "lang.ru")}
        </button>
      ))}
    </div>
  );
}
