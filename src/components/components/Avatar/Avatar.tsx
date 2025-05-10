import React, { useMemo } from "react";
import { createAvatar } from "@dicebear/core";
import { bottts } from "@dicebear/collection";
import clsx from "clsx";

interface AvatarProps {
  seed: string;
  className?: string;
  backgroundColor?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  seed,
  className,
  backgroundColor = "#3a3a3a",
}) => {
  const bucket = Math.floor(Date.now() / (6 * 60 * 60 * 1000));
  const fullSeed = `${seed}-${bucket}`;

  const dataUri = useMemo(() => {
    return createAvatar(bottts, { seed: fullSeed, size: 160 }).toDataUri();
  }, [fullSeed]);

  return (
    <div
      className={clsx("rounded-full overflow-hidden", className)}
      style={{ backgroundColor }}
    >
      <img src={dataUri} alt="avatar" className="w-full h-full block" />
    </div>
  );
};
