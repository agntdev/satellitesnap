import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { en } from "./locales/en";
import { ru } from "./locales/ru";
import {
  I18nProvider,
  detectInitialLocale,
  translate,
  useI18n,
} from "./index";

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

describe("locale parity", () => {
  it("ru defines exactly the same keys as en", () => {
    expect(Object.keys(ru).sort()).toEqual(Object.keys(en).sort());
  });

  it("no ru value is left as the English original", () => {
    // A cheap guard against forgotten translations: every value should differ
    // from en (allowing the few intentional shared tokens like EN/RU/dates).
    const shared = new Set(["lang.en", "lang.ru"]);
    for (const key of Object.keys(en) as (keyof typeof en)[]) {
      if (shared.has(key)) continue;
      expect(ru[key], `key ${key}`).not.toBe(en[key]);
    }
  });
});

describe("translate", () => {
  it("interpolates {tokens}", () => {
    expect(translate("en", "status.target", { label: "Oslo" })).toBe(
      "target: Oslo",
    );
    expect(translate("ru", "status.target", { label: "Осло" })).toBe(
      "цель: Осло",
    );
  });

  it("falls back to English for an unknown locale", () => {
    // @ts-expect-error — exercising the runtime fallback path
    expect(translate("de", "tagline")).toBe(en.tagline);
  });
});

describe("detectInitialLocale", () => {
  it("prefers a saved choice", () => {
    localStorage.setItem("satellitesnap.lang", "ru");
    expect(detectInitialLocale()).toBe("ru");
  });
});

function Probe() {
  const { t, locale } = useI18n();
  return <p>{`${locale}:${t("search.submit")}`}</p>;
}

describe("I18nProvider", () => {
  it("switches locale, persists it, and sets <html lang>", async () => {
    function Harness() {
      const { setLocale } = useI18n();
      return (
        <>
          <button onClick={() => setLocale("ru")}>go-ru</button>
          <Probe />
        </>
      );
    }
    render(
      <I18nProvider>
        <Harness />
      </I18nProvider>,
    );

    expect(screen.getByText(/^en:/)).toBeInTheDocument();
    await userEvent.click(screen.getByText("go-ru"));

    expect(screen.getByText(/^ru:/)).toBeInTheDocument();
    expect(screen.getByText("ru:снимок ⮐")).toBeInTheDocument();
    expect(localStorage.getItem("satellitesnap.lang")).toBe("ru");
    expect(document.documentElement.lang).toBe("ru");
  });
});
