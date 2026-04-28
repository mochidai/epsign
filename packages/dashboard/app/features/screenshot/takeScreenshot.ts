import type { LoaderFunction } from "@remix-run/node";
import { chromium } from "playwright";

const CHROMIUM_FLAGS = [
  "--disable-gpu",
  "--disable-dev-shm-usage",
  "--disable-setuid-sandbox",
  "--no-first-run",
  "--no-sandbox",
  "--no-zygote",
  "--single-process",
  "--disable-audio-output",
  "--disable-background-timer-throttling",
  "--disable-backgrounding-occluded-windows",
  "--disable-breakpad",
  "--disable-extensions",
  "--disable-sync",
  "--disable-translate",
  // '--virtual-time-budget=10000'
];

export const takeScreenshot = async (url: string) => {
  const browser = await chromium.launch({ headless: true, args: CHROMIUM_FLAGS });

  const context = await browser.newContext({
    viewport: { width: 1360, height: 480 },
    deviceScaleFactor: 1,
  });

  const page = await context.newPage();
  await page.goto(url, {
    waitUntil: "networkidle",
  });

  const screenshot = await page.screenshot({
    type: "png",
    clip: {
      x: 0,
      y: 0,
      width: 1360,
      height: 480,
    },
  });

  await browser.close();

  return screenshot;
};
