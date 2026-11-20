/**
 * Framing of an image inside a fixed shape (square photo, wide cover). The crop is the centre of the
 * visible area (0..1 of the image) and the zoom (1 = the image just covers the frame).
 */
export interface Crop { x: number; y: number; zoom: number }
export const CENTERED: Crop = { x: 0.5, y: 0.5, zoom: 1 };
export const MIN_ZOOM = 1;
export const MAX_ZOOM = 3;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Part of the image (in image pixels) seen through a frame of the given aspect ratio. */
export function visibleRect(imageWidth: number, imageHeight: number, aspect: number, crop: Crop) {
  const cover = Math.max(aspect / imageWidth, 1 / imageHeight);
  const zoom = clamp(crop.zoom, MIN_ZOOM, MAX_ZOOM);
  const w = aspect / (cover * zoom);
  const h = 1 / (cover * zoom);
  const x = clamp(crop.x * imageWidth - w / 2, 0, Math.max(0, imageWidth - w));
  const y = clamp(crop.y * imageHeight - h / 2, 0, Math.max(0, imageHeight - h));
  return { x, y, w, h };
}

/** Keeps the frame inside the image (no empty borders), returning the corrected crop. */
export function clampCrop(imageWidth: number, imageHeight: number, aspect: number, crop: Crop): Crop {
  const zoom = clamp(crop.zoom, MIN_ZOOM, MAX_ZOOM);
  const rect = visibleRect(imageWidth, imageHeight, aspect, { ...crop, zoom });
  return { x: (rect.x + rect.w / 2) / imageWidth, y: (rect.y + rect.h / 2) / imageHeight, zoom };
}

export const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
  const image = new Image();
  // Stored images come from the API domain: asked without credentials so the canvas can read them back.
  image.crossOrigin = "anonymous";
  image.onload = () => resolve(image);
  image.onerror = () => reject(new Error("image"));
  image.src = src;
});

/**
 * Draws the framed part again at a fixed size. Re-encoding in the browser also drops the original
 * file's metadata (camera, place) and anything that is not image pixels. Tries WebP (keeps
 * transparency), then PNG or JPEG, lowering the quality until it fits `maxBytes`.
 */
export async function renderCrop(src: string, aspect: number, crop: Crop, width: number, maxBytes: number): Promise<string | null> {
  const image = await loadImage(src);
  const rect = visibleRect(image.naturalWidth, image.naturalHeight, aspect, crop);
  const height = Math.round(width / aspect);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return null;
  context.imageSmoothingQuality = "high";
  context.drawImage(image, rect.x, rect.y, rect.w, rect.h, 0, 0, width, height);
  const bytes = (url: string) => Math.floor(((url.length - url.indexOf(",") - 1) * 3) / 4);
  for (const quality of [0.9, 0.8]) {
    const webp = canvas.toDataURL("image/webp", quality);
    if (webp.startsWith("data:image/webp") && bytes(webp) <= maxBytes) return webp;
  }
  const png = canvas.toDataURL("image/png");
  if (bytes(png) <= maxBytes) return png;
  // JPEG has no transparency: paint a white background under the image.
  context.globalCompositeOperation = "destination-over";
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  for (const quality of [0.88, 0.75, 0.6]) {
    const jpeg = canvas.toDataURL("image/jpeg", quality);
    if (bytes(jpeg) <= maxBytes) return jpeg;
  }
  return null;
}
