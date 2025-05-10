import React, { useMemo } from "react";
import { createAvatar } from "@dicebear/core";
import { bottts } from "@dicebear/collection";
import clsx from "clsx";

interface AvatarProps {
  seed: string;
  backgroundColor?: string;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  seed,
  backgroundColor = "#3a3a3a",
  className,
}) => {
  const bucket = Math.floor(Date.now() / (6 * 60 * 60 * 1000));
  const fullSeed = `${seed}-${bucket}`;

  const svg = useMemo(() => {
    const raw = createAvatar(bottts, { seed: fullSeed, size: 160 })
      .toString()
      .replace(/\swidth="[^"]*"/g, "")
      .replace(/\sheight="[^"]*"/g, "")
      .replace(
        /<svg/,
        `<svg width="100%" height="100%"`
      );
    return raw;
  }, [fullSeed]);

  return (
    <div
      className={clsx("rounded-full overflow-hidden", className)}
      style={{ backgroundColor }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
};
