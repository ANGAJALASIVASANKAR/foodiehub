import { useState } from 'react';

const FALLBACK =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#fff1f0"/><stop offset="100%" stop-color="#ffe0dc"/>
      </linearGradient></defs>
      <rect width="600" height="400" fill="url(#g)"/>
      <text x="300" y="195" font-size="64" text-anchor="middle">🍽️</text>
      <text x="300" y="255" font-family="sans-serif" font-size="20" fill="#c2413a" text-anchor="middle">FOODIEHUB</text>
    </svg>`,
  );

interface Props {
  src?: string | null;
  alt: string;
  className?: string;
}

export default function FoodImage({ src, alt, className }: Props) {
  const [current, setCurrent] = useState(src || FALLBACK);
  return (
    <img
      className={className}
      src={current}
      alt={alt}
      loading="lazy"
      onError={() => {
        if (current !== FALLBACK) setCurrent(FALLBACK);
      }}
    />
  );
}
