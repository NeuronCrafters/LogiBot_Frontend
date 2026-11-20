import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { Crosshair } from "lucide-react";
import { t, useLocale } from "@/i18n";
import { cn } from "@/shared/lib/cn";
import { clampCrop, MAX_ZOOM, MIN_ZOOM, visibleRect, type Crop, CENTERED } from "@/features/institutions/lib/imageCrop";

/**
 * Framing editor: drag with the mouse or a finger, arrow keys move, + and − (or the slider) zoom,
 * Home or "Center" puts it back in the middle. What shows in the frame is what will be saved.
 */
export function ImageCropper({ src, aspect, crop, onChange, label, className }: {
  src: string; aspect: number; crop: Crop; onChange: (crop: Crop) => void; label: string; className?: string;
}) {
  useLocale();
  const id = useId();
  const frame = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; crop: Crop } | null>(null);
  const [frameWidth, setFrameWidth] = useState(0);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    const element = frame.current;
    if (!element) return;
    const update = () => setFrameWidth(element.getBoundingClientRect().width);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const apply = (next: Crop) => onChange(natural ? clampCrop(natural.w, natural.h, aspect, next) : next);
  const rect = natural ? visibleRect(natural.w, natural.h, aspect, crop) : null;
  const scale = rect && frameWidth ? frameWidth / rect.w : 0;

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture?.(event.pointerId);
    drag.current = { x: event.clientX, y: event.clientY, crop };
  }
  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!drag.current || !natural || !scale) return;
    const start = drag.current;
    apply({ ...start.crop, x: start.crop.x - (event.clientX - start.x) / (scale * natural.w), y: start.crop.y - (event.clientY - start.y) / (scale * natural.h) });
  }
  const onPointerUp = () => { drag.current = null; };

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!natural || !rect) return;
    const stepX = (rect.w * 0.05) / natural.w;
    const stepY = (rect.h * 0.05) / natural.h;
    const moves: Record<string, Partial<Crop>> = {
      ArrowLeft: { x: crop.x - stepX }, ArrowRight: { x: crop.x + stepX }, ArrowUp: { y: crop.y - stepY }, ArrowDown: { y: crop.y + stepY },
      "+": { zoom: crop.zoom + 0.1 }, "=": { zoom: crop.zoom + 0.1 }, "-": { zoom: crop.zoom - 0.1 }, Home: CENTERED,
    };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    apply({ ...crop, ...move });
  }

  return (
    <div className={cn("grid gap-2 font-[Poppins]", className)}>
      <div ref={frame} role="group" tabIndex={0} aria-label={label} aria-describedby={`${id}-hint`} style={{ aspectRatio: String(aspect) }}
        onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} onKeyDown={onKeyDown}
        className="relative w-full cursor-grab touch-none select-none overflow-hidden rounded-xl border border-white/20 bg-surface-sunken outline-none focus-visible:ring-2 focus-visible:ring-blue-400 active:cursor-grabbing">
        <img src={src} alt="" crossOrigin="anonymous" draggable={false} onLoad={(event) => setNatural({ w: event.currentTarget.naturalWidth, h: event.currentTarget.naturalHeight })}
          className={cn("pointer-events-none absolute max-w-none", !rect && "h-full w-full object-cover")}
          style={rect && scale ? { width: natural!.w * scale, height: natural!.h * scale, left: -rect.x * scale, top: -rect.y * scale } : undefined} />
      </div>
      <p id={`${id}-hint`} className="text-xs text-zinc-400">{t("institutions.crop.hint")}</p>
      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor={`${id}-zoom`} className="text-sm font-medium text-zinc-200">{t("institutions.crop.zoom")}</label>
        <input id={`${id}-zoom`} type="range" min={MIN_ZOOM} max={MAX_ZOOM} step={0.05} value={crop.zoom}
          aria-valuetext={`${Math.round(crop.zoom * 100)}%`} onChange={(event) => apply({ ...crop, zoom: Number(event.target.value) })}
          className="h-11 min-w-[8rem] flex-1 accent-blue-500" />
        <button type="button" onClick={() => apply(CENTERED)}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-white/15 px-3 text-sm font-semibold text-white hover:bg-white/10 md:min-h-9">
          <Crosshair aria-hidden="true" className="h-4 w-4" />{t("institutions.crop.center")}
        </button>
      </div>
    </div>
  );
}
