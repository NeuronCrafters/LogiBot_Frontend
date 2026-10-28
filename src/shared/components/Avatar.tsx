import { t, useLocale } from "@/i18n";
﻿import { useMemo } from "react";
import { cn } from "@/shared/lib/cn";

interface AvatarProps {
  seed: string;
  className?: string;
  backgroundColor?: string;
}

export function Avatar({
  seed,
  className,
  backgroundColor = "#3a3a3a",
}: AvatarProps) {
  const avatarUrl = useMemo(() => {
    const bucket = Math.floor(Date.now() / (6 * 60 * 60 * 1000));
    const fullSeed = encodeURIComponent(`${seed}-${bucket}`);
    return `https://api.dicebear.com/9.x/bottts/svg?seed=${fullSeed}&size=160`;
  }, [seed]);

  useLocale();
  return (
    <div
      className={cn("overflow-hidden rounded-full", className)}
      style={{ backgroundColor }}
    >
      <img src={avatarUrl} alt={t("common.avatar")} className="block h-full w-full" />
    </div>
  );
}
