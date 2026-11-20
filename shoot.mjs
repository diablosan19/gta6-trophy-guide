// Takes this entry's screenshots: serves app/ locally, drives headless
// Chromium through the four views the judge should see, and writes JPEGs
// into screenshots/ at the sizes the gate allows (long side 1280, each
// under 256 KiB). Run with: node shoot.mjs
//
// The browser is playwright-core's chromium with the locally cached
// headless shell; the make.fun workspace's node_modules provides the
// library, since this repository installs nothing.

import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('/home/hatch/workspace/makefun/node_modules/playwright-core');

const here = fileURLToPath(new URL('.', import.meta.url));
const appRoot = resolve(join(here, 'app'));
const shotsDir = join(here, 'screenshots');
const CHROME = '/home/hatch/.cache/ms-playwright/chromium_headless_shell-1200/chrome-headless-shell-linux64/chrome-headless-shell';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

const server = createServer((req, res) => {
  const path = normalize(join(appRoot, decodeURIComponent(new URL(req.url, 'http://x').pathname)));
  if (!path.startsWith(appRoot + sep) && path !== appRoot) {
    res.writeHead(403).end();
    return;
  }
  const file = existsSync(path) && statSync(path).isDirectory() ? join(path, 'index.html') : path;
  if (!existsSync(file) || !statSync(file).isFile()) {
    res.writeHead(404).end();
    return;
  }
  res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' });
  createReadStream(file).pipe(res);
});

await new Promise((done) => server.listen(0, '127.0.0.1', done));
const base = `http://127.0.0.1:${server.address().port}/`;

const browser = await chromium.launch({ executablePath: CHROME });

async function shootPage(name, seed, drive) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  if (seed) {
    await context.addInitScript((data) => {
      localStorage.setItem('leonida-trophy-guide.progress.v1', JSON.stringify({ earned: data.earned }));
      localStorage.setItem('leonida-trophy-guide.settings.v1', JSON.stringify(data.settings));
    }, seed);
  }
  const page = await context.newPage();
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.waitForSelector('.trophy-row');
  if (drive) await drive(page);
  // Clicks scroll the clicked row into view; the detail panel is sticky, so
  // returning to the top keeps it in frame and shows the masthead and
  // toolbar that identify the app at a glance.
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(250);
  const file = join(shotsDir, name);
  await page.screenshot({ path: file, type: 'jpeg', quality: 80 });
  console.log('shot', name, statSync(file).size, 'bytes');
  await context.close();
}

// 1 — the cover: tracker mid-run, a story trophy's guide and sources open.
await shootPage(
  '1-guide.jpg',
  { earned: [2, 3, 4, 5, 8, 9, 10, 16, 21, 35, 53], settings: { spoilers: false, hideEarned: false } },
  async (page) => {
    await page.locator('.trophy-row', { hasText: 'Break the Bank' }).first().click();
    await page.waitForSelector('.detail .source-list');
  },
);

// 2 — the roadmap: intro, the point-of-no-return warning, first stages.
await shootPage(
  '2-roadmap.jpg',
  { earned: [2, 3, 4, 5, 8, 9, 10, 16, 21, 35, 53], settings: { spoilers: false, hideEarned: false } },
  async (page) => {
    await page.click('#tab-roadmap');
    await page.waitForSelector('.stage');
  },
);

// 3 — the missable filter with a partner trophy's warning open.
await shootPage(
  '3-missables.jpg',
  { earned: [2, 3, 8], settings: { spoilers: false, hideEarned: false } },
  async (page) => {
    await page.locator('.chip', { hasText: 'Missable' }).first().click();
    await page.locator('.trophy-row', { hasText: 'Hot Together' }).first().click();
    await page.waitForSelector('.missable-box');
  },
);

// 4 — spoiler protection on: unearned story trophies are masked.
await shootPage(
  '4-spoilers.jpg',
  { earned: [2, 3], settings: { spoilers: true, hideEarned: false } },
  async (page) => {
    await page.locator('.trophy-row', { hasText: 'Hidden story trophy' }).first().click();
  },
);

await browser.close();
server.close();
console.log('screenshots done');
