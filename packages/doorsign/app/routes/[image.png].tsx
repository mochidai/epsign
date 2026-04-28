import type { LoaderFunction } from "@remix-run/node";
import DCache from "~/features/cache/cache";
import { takeScreenshot } from "~/features/screenshot/takeScreenshot";

export const loader: LoaderFunction = async ({ request }) => {
  const port = process.env.SERVER_PORT || 3000;
  const url = `http://localhost:${port}/dashboard`;

  const cache = DCache.getInstance();

  let img = cache.get<Buffer>("img");

  if (!img) {
    img = await takeScreenshot(url);

    cache.set("img", img, 60 * 60 * 1000);
  }

  return new Response(img, {
    headers: {
      "Content-Type": "image/png",
    },
  });
};
