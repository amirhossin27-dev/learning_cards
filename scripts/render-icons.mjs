// Renders public/icons/icon.svg to the PNG sizes iOS and Android need.
// Usage: node scripts/render-icons.mjs  (needs Playwright with Chromium)
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

// CommonJS require so a globally installed Playwright is found too.
const { chromium } = createRequire(import.meta.url)('playwright');

const svg = readFileSync(new URL('../public/icons/icon.svg', import.meta.url), 'utf8');
const targets = [
  ['apple-touch-icon.png', 180],
  ['icon-192.png', 192],
  ['icon-512.png', 512],
];

const browser = await chromium.launch();
const page = await browser.newPage();
for (const [name, size] of targets) {
  await page.setViewportSize({ width: size, height: size });
  // iOS rounds the corners itself, so the touch icon is rendered without transparency.
  const body = name.startsWith('apple') ? svg.replace(/rx="112"/, 'rx="0"') : svg;
  await page.setContent(`<style>html,body{margin:0;background:transparent}svg{width:${size}px;height:${size}px;display:block}</style>${body}`);
  await page.screenshot({ path: new URL(`../public/icons/${name}`, import.meta.url).pathname, omitBackground: true });
}
await browser.close();
