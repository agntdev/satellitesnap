import { useState } from "react";
import type { ImageMetadata } from "../services/metadata";

export interface MetadataPanelProps {
  metadata: ImageMetadata;
}

interface Row {
  k: string;
  v: string;
}

/**
 * EXIF-style metadata overlay. Collapsed to a toggle by default so it never
 * obscures the imagery; expanded it lists the observable image facts.
 */
export default function MetadataPanel({ metadata }: MetadataPanelProps) {
  const [open, setOpen] = useState(false);

  const rows: Row[] = [
    { k: "location", v: metadata.label },
    {
      k: "lat,lng",
      v: `${metadata.lat.toFixed(5)}, ${metadata.lng.toFixed(5)}`,
    },
    { k: "source", v: metadata.source },
    { k: "date", v: metadata.date ?? "latest available" },
    { k: "zoom", v: `z${metadata.zoom}` },
    { k: "resolution", v: metadata.resolution },
  ];

  return (
    <div className={`metadata ${open ? "metadata--open" : ""}`}>
      <button
        className="metadata__toggle"
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        {open ? "▾" : "▸"} metadata
      </button>
      {open && (
        <dl className="metadata__list">
          {rows.map((r) => (
            <div className="metadata__row" key={r.k}>
              <dt className="metadata__key text-dim">{r.k}</dt>
              <dd className="metadata__val">{r.v}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
