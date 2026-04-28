import type { LoaderFunction } from "@remix-run/node";
import DCache from "~/features/cache/cache";
import { ditherImageBuffer } from "~/features/dithering/dithering";
import { takeScreenshot } from "~/features/screenshot/takeScreenshot";

export const loader: LoaderFunction = async ({ request }) => {
  const port = process.env.SERVER_PORT || 3000;
  const url = `http://localhost:${port}/dashboard`;

  const cache = DCache.getInstance();

  let dithredImg = cache.get<Buffer>("dithredImg");

  if (!dithredImg) {
    const ss = await takeScreenshot(url);

    const palette = [
      "#FF0000", // Red
      "#00FF00", // Green
      "#0000FF", // Blue
      "#FFFF00", // Yellow
      "#FF8000", // Orange
      "#000000", // Black
      "#FFFFFF", // White
    ]; // カラーパレット(Waveshare 7.3inch e-Paper HAT (F))
    dithredImg = await ditherImageBuffer(ss, palette);
    cache.set("dithredImg", dithredImg, 60 * 60 * 1000);
  }

  return new Response(dithredImg, {
    headers: {
      "Content-Type": "image/png",
    },
  });
};
