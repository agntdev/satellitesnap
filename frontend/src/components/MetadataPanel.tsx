import { useState } from "react";
import type { ImageMetadata } from "../services/metadata";
import { useI18n, type TranslationKey } from "../i18n";

export interface MetadataPanelProps {
  metadata: ImageMetadata;
}

interface Row {
  /** Stable React key + i18n label key. */
  k: TranslationKey;
  v: string;
}

/**
 * EXIF-style metadata overlay. Collapsed to a toggle by default so it never
 * obscures the imagery; expanded it lists the observable image facts.
 */
export default function MetadataPanel({ metadata }: MetadataPanelProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  const rows: Row[] = [
    { k: "metadata.location", v: metadata.label },
    {
      k: "metadata.latlng",
      v: `${metadata.lat.toFixed(5)}, ${metadata.lng.toFixed(5)}`,
    },
    { k: "metadata.source", v: metadata.source },
    { k: "metadata.date", v: metadata.date ?? t("metadata.latest") },
    { k: "metadata.zoom", v: `z${metadata.zoom}` },
    { k: "metadata.resolution", v: metadata.resolution },
  ];

  return (
    <div className={`metadata ${open ? "metadata--open" : ""}`}>
      <button
        className="metadata__toggle"
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        {open ? "▾" : "▸"} {t("metadata.toggle")}
      </button>
      {open && (
        <dl className="metadata__list">
          {rows.map((r) => (
            <div className="metadata__row" key={r.k}>
              <dt className="metadata__key text-dim">{t(r.k)}</dt>
              <dd className="metadata__val">{r.v}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
