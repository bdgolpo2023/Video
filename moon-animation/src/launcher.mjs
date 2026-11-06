import { createRequire } from 'module';
import fs from 'fs'; import path from 'path';
const require = createRequire(import.meta.url);
const { chromium } = require('/inner_container/opt/toolchains/.nvm/versions/node/v22.23.4/lib/node_modules/@playwright/mcp/node_modules/playwright-core');
process.env.TMPDIR ||= '/projects/sandbox/work/tmp';
const types = {'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.mp4':'video/mp4','.mp3':'audio/mpeg','.json':'application/json','.png':'image/png','.wav':'audio/wav','.css':'text/css'};
// Serve files: http://localhost/<abs-path-without-leading-slash>
export async function open({ headless = true } = {}) {
  const browser = await chromium.launch({
    executablePath: '/usr/local/bin/chrome',
    args: ['--no-sandbox','--disable-crash-reporter','--autoplay-policy=no-user-gesture-required','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--js-flags=--max-old-space-size=8192'],
  });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on('console', m => console.log('[page]', m.text()));
  page.on('pageerror', e => console.log('[pageerror]', e.message));
  await page.route('http://localhost/**', async route => {
    const u = new URL(route.request().url());
    const f = decodeURIComponent(u.pathname);
    if (!fs.existsSync(f)) return route.fulfill({ status: 404, body: 'nf' });
    route.fulfill({ body: fs.readFileSync(f), contentType: types[path.extname(f)] || 'application/octet-stream' });
  });
  return { browser, page };
}
