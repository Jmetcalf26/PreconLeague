"use client";

import { useState } from "react";

type Props = {
  name: string;
  image: string | null;
  className?: string;
};

// Plain <img> (not next/image) so it works fully offline / self-hosted with no
// image-optimization server. Scryfall card images are already well-sized.
export function CardThumb({ name, image, className }: Props) {
  const [errored, setErrored] = useState(false);

  if (!image || errored) {
    return (
      <div
        className={`flex items-center justify-center rounded-xl border border-ink-700 bg-ink-800 p-2 text-center text-xs text-ink-400 ${className ?? ""}`}
      >
        {name}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={image}
      alt={name}
      loading="lazy"
      onError={() => setErrored(true)}
      className={`rounded-xl border border-ink-700 bg-ink-900 object-cover ${className ?? ""}`}
    />
  );
}
