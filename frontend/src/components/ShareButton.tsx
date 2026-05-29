import { useState } from "react";
import { useI18n } from "../i18n";

export interface ShareButtonProps {
  /** Absolute URL to share. */
  url: string;
}

/** Copies a permalink to the clipboard with transient "copied" feedback. */
export default function ShareButton({ url }: ShareButtonProps) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Clipboard API unavailable (e.g. insecure context) — fall back to a
      // throwaway textarea + execCommand so the button still works.
      const ta = document.createElement("textarea");
      ta.value = url;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
      } finally {
        document.body.removeChild(ta);
      }
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button
      className="btn share-btn"
      type="button"
      onClick={copy}
      aria-label={t("share.aria")}
    >
      {copied ? t("share.copied") : t("share.copy")}
    </button>
  );
}
