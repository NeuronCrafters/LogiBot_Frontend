import React, { useMemo } from "react";
import { createAvatar } from "@dicebear/core";
import { bottts } from "@dicebear/collection";

interface AvatarProps {
  /** stable per-user seed, e.g. user._id */
  seed: string;
  /** diameter in px (usado apenas como fallback caso não passe via className) */
  size?: number;
  /** background fill behind the SVG */
  backgroundColor?: string;
  /** classes extras para controlar tamanho, bordas etc via Tailwind */
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  seed,
  size = 160,
  backgroundColor = "#3a3a3a",
  className = "",
}) => {
  // bucket muda a cada 6h para rotacionar o avatar
  const bucket = Math.floor(Date.now() / (6 * 60 * 60 * 1000));
  const fullSeed = `${seed}-${bucket}`;

  // gera o SVG memoizado
  const svg = useMemo(
    () =>
      createAvatar(bottts, {
        seed: fullSeed,
        size,             // esse tamanho ainda define o viewBox
      }),
    [fullSeed, size]
  );

  return (
    <div
      className={`rounded-full overflow-hidden ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor,
      }}
      // internos do DiceBear já são SVG, podemos injetar diretamente
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
};
