// Full-page and first-screen captures of each skill demo, as PNGs, for the gallery previews.
// Usage: node capture.mjs <outDir> <id> [<id> ...]
import { chromium } from '/Users/musaburke/Projects/portfolio/node_modules/playwright-core/index.mjs';

const BASE = process.env.BASE_URL ?? 'http://localhost:4324';
const [outDir, ...ids] = process.argv.slice(2);
const views = [
  { name: 'desktop', width: 1440, height: 900, scale: 1.5 },
  { name: 'mobile', width: 390, height: 844, scale: 2 },
];

const browser = await chromium.launch({ channel: 'chrome' });
for (const id of ids) {
  for (const v of views) {
    const page = await browser.newPage({ viewport: { width: v.width, height: v.height }, deviceScaleFactor: v.scale });
    await page.goto(`${BASE}/skill-demos/${id}/index.html`, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(2500);
    // First screen, once the entrance has settled.
    await page.screenshot({ path: `${outDir}/${id}-${v.name}.png` });
    // Walk down the page so every scroll-triggered reveal fires, then return to the top.
    await page.evaluate(async () => {
      const step = innerHeight * 0.6;
      for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
        scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 350));
      }
      scrollTo(0, 0);
    });
    await page.waitForTimeout(1500);
    // A full-page capture paints a bottom-stuck element where it sits in the window at
    // scroll 0, leaving its own place blank. Put such elements back in the flow for this shot.
    await page.evaluate(() => {
      for (const el of document.querySelectorAll('body *')) {
        const cs = getComputedStyle(el);
        if (cs.position === 'sticky' && cs.bottom !== 'auto') el.style.position = 'relative';
      }
    });
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${outDir}/${id}-${v.name}-full.png`, fullPage: true });
    await page.close();
  }
  console.log('captured', id);
}
await browser.close();
