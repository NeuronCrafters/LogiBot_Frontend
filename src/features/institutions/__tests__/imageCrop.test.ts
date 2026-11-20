import { expect, it } from "vitest";
import { clampCrop, visibleRect } from "@/features/institutions/lib/imageCrop";

it("covers the frame with the image and keeps the frame inside it", () => {
  // 800 × 400 image in a square frame: zoom 1 shows a 400 × 400 square in the middle.
  expect(visibleRect(800, 400, 1, { x: 0.5, y: 0.5, zoom: 1 })).toEqual({ x: 200, y: 0, w: 400, h: 400 });
  // Zoom 2 shows half of it; asking for the far left edge stops at the border.
  expect(visibleRect(800, 400, 1, { x: 0, y: 0.5, zoom: 2 })).toEqual({ x: 0, y: 100, w: 200, h: 200 });
  // Out of range: zoom stops at 3 (a 133 px square) and the centre moves back inside the image.
  const clamped = clampCrop(800, 400, 1, { x: -1, y: 2, zoom: 9 });
  expect(clamped.zoom).toBe(3);
  expect(clamped.x).toBeCloseTo(1 / 12);
  expect(clamped.y).toBeCloseTo(5 / 6);
});

it("frames a wide cover (4:1) from a taller image", () => {
  expect(visibleRect(1000, 1000, 4, { x: 0.5, y: 0.5, zoom: 1 })).toEqual({ x: 0, y: 375, w: 1000, h: 250 });
});
