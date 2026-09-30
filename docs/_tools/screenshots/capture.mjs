/**
 * Regenerates the 5.0 documentation screenshots from a running OpenCelium
 * instance. Every shot is authentic — nothing here retouches an image.
 *
 * Requirements
 *   node >= 20, `npm i playwright-core`, and a Chromium build. Point EXEC at it
 *   (Playwright's cache lives in ~/.cache/ms-playwright/chromium-*/chrome-linux64/chrome).
 *
 * Usage
 *   BASE=http://127.0.0.1 OC_USER=admin@opencelium.io OC_PASS=1234 \
 *   OC_MASTER=<master-password> node capture.mjs
 *
 *   Shoot the *production* build (nginx on :80), not the Vite dev server on
 *   :5173 — the dev server runs MSW mocks, so its data is fake.
 *
 * Notes
 *   - Screenshots are 2x (deviceScaleFactor) at a 1600x950 viewport.
 *   - The editor is reopened fresh for each shot: Escape does not reliably
 *     dismiss the antd modal/drawer overlays, and a stale overlay silently
 *     blocks every later click.
 *   - Never click buttons by index inside the canvas — the test-run control
 *     lives there and starting a run mutates the instance. Use the testids.
 */
import { chromium } from 'playwright-core';
import fs from 'node:fs';

const EXEC = process.env.CHROMIUM
  || '/root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome';
const BASE = process.env.BASE || 'http://127.0.0.1';
const USER = process.env.OC_USER || 'admin@opencelium.io';
const PASS = process.env.OC_PASS || '1234';
const MASTER = process.env.OC_MASTER || '';
const WF = process.env.OC_WORKFLOW || 'GetSwitches fast (static if-condition)';
const OUT = process.env.OUT || 'out';

fs.mkdirSync(OUT, { recursive: true });
const log = [];

const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const ctx = await browser.newContext({ viewport: { width: 1600, height: 950 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();

const settle = async ms => { await page.waitForTimeout(ms); await page.waitForLoadState('networkidle').catch(() => {}); };
const snap = (n, clip) => page.screenshot(clip ? { path: `${OUT}/${n}.png`, clip } : { path: `${OUT}/${n}.png` });

async function step(name, fn) {
  try { await fn(); log.push(`ok   ${name}`); console.log(`ok   ${name}`); }
  catch (e) { log.push(`FAIL ${name}: ${e.message.split('\n')[0].slice(0, 120)}`); console.log(`FAIL ${name}`); }
}

async function login() {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await page.getByTestId('login-email').fill(USER);
  await page.getByTestId('login-password').fill(PASS);
  await page.getByTestId('login-submit').click();
  await page.waitForURL(u => !u.pathname.startsWith('/login'), { timeout: 60000 });
  await page.waitForLoadState('networkidle');
}

async function openEditor() {
  await page.goto(`${BASE}/workflow`, { waitUntil: 'networkidle' });
  await settle(2500);
  await page.locator('tr', { hasText: WF }).first().locator('svg').nth(2).click();
  await page.waitForURL(/\/workflow\/update\//, { timeout: 30000 });
  await settle(6000);
}

// ---- public pages ---------------------------------------------------------
await step('login', async () => {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await settle(1800);
  await snap('login');
});
await step('forgot-password', async () => {
  await page.goto(`${BASE}/forgot-password`, { waitUntil: 'networkidle' });
  await settle(1800);
  await snap('forgot-password', { x: 500, y: 250, width: 600, height: 450 });
});

await login();

// ---- dashboard: the metrics socket needs several seconds; the bottom row of
// cards is "Coming soon" placeholder content, so crop it off.
await step('dashboard', async () => {
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await settle(9000);
  await snap('dashboard', { x: 0, y: 0, width: 1600, height: 478 });
});

// ---- plain list pages ----------------------------------------------------
for (const [name, route] of [
  ['connector-list', '/connector'], ['workflow-list', '/workflow'], ['schedule-list', '/schedule'],
  ['user-list', '/user'], ['role-list', '/role'], ['ldap-check', '/ldap/check'],
  ['invoker-list', '/invoker'], ['workflow-template-list', '/workflow-template'],
  ['data-aggregator-list', '/data-aggregator'], ['notification-template-list', '/notification-template'],
  ['category-list', '/category'], ['support-file-list', '/support-file'],
  ['license', '/license'], ['update-assistant', '/update-assistant'],
  ['system-check', '/system-check'], ['ui-config', '/ui/config'],
]) {
  await step(name, async () => {
    await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle' });
    await settle(2500);
    await snap(name);
  });
}

// ---- command palette -----------------------------------------------------
await step('command-palette', async () => {
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await settle(3000);
  await page.getByTestId('command-palette-input').click();
  await settle(1200);
  await snap('command-palette', { x: 700, y: 0, width: 900, height: 620 });
});

// A command only fires while a suggestion is highlighted, so type a *prefix*.
await step('command-reference', async () => {
  const i = page.getByTestId('command-palette-input');
  await i.click(); await i.fill(''); await i.type('hel', { delay: 60 });
  await settle(900);
  await page.keyboard.press('Enter');
  await settle(2000);
  await snap('command-reference');
});

// ---- System Configuration (master password gated) ------------------------
await step('system-config-tree', async () => {
  if (!MASTER) throw new Error('OC_MASTER not set');
  await page.goto(`${BASE}/system-config`, { waitUntil: 'networkidle' });
  await settle(2000);
  await page.locator('input[type="password"]').first().fill(MASTER);
  await page.getByRole('button', { name: /send/i }).first().click();
  await settle(4000);
  await snap('system-config-tree');
});

// ---- execution log tree: scope the select to the modal. `input[role=combobox]`
// alone also matches the cmdk command palette.
await step('execution-log-tree', async () => {
  await page.goto(`${BASE}/schedule`, { waitUntil: 'networkidle' });
  await settle(2500);
  await page.getByText('see logs').first().click();
  await settle(2500);
  await page.locator('.ant-modal .ant-select, [role="dialog"] .ant-select').first().click();
  await settle(2000);
  await page.locator('.ant-select-dropdown [class*="option"]').first().click({ timeout: 12000 });
  await settle(6000);
  await snap('execution-log-tree');
});

await step('schedule-notifications', async () => {
  await page.goto(`${BASE}/schedule`, { waitUntil: 'networkidle' });
  await settle(3000);
  await page.locator('tbody input[type=checkbox], tbody .ant-checkbox-input').first().check({ timeout: 8000 });
  await settle(1200);
  await page.getByTestId('schedule-bulk-action-notifications').click({ timeout: 8000 });
  await settle(3500);
  await snap('schedule-notifications');
});

// ---- wizards (opened read-only, never submitted) -------------------------
await step('connector-wizard', async () => {
  await page.goto(`${BASE}/connector`, { waitUntil: 'networkidle' });
  await settle(2500);
  await page.locator('tbody tr').first().locator('svg').nth(0).click();
  await settle(3500);
  await snap('connector-wizard');
});
await step('user-wizard', async () => {
  await page.goto(`${BASE}/user`, { waitUntil: 'networkidle' });
  await settle(2500);
  await page.locator('tbody tr').first().locator('svg').nth(0).click();
  await settle(3500);
  await snap('user-wizard');
});

// ---- workflow editor: one fresh editor per shot -------------------------
await step('workflow-editor', async () => {
  await openEditor();
  await snap('workflow-editor', { x: 300, y: 0, width: 1000, height: 560 });
});

await step('node-context-menu', async () => {
  await openEditor();
  await page.getByTestId('rf__node-if-1').click({ button: 'right' });
  await settle(1500);
  await snap('node-context-menu', { x: 700, y: 150, width: 800, height: 600 });
});

await step('condition-builder', async () => {
  await openEditor();
  await page.getByTestId('rf__node-if-1').dblclick();
  await settle(3500);
  await snap('condition-builder');
});

await step('body-dialog', async () => {
  await openEditor();
  await page.getByTestId('rf__node-method-0').click({ button: 'right' });
  await settle(1500);
  await page.getByText(/Edit Body/i).first().click({ timeout: 6000 });
  await settle(4000);
  await snap('body-dialog');
});

await step('add-step-sidebar', async () => {
  await openEditor();
  // Click the add handle rendered on the start node's outgoing edge.
  await page.getByTestId('rf__node-start-1').hover();
  await settle(1000);
  await page.locator('.react-flow__node-start button').first().click({ timeout: 6000 });
  await settle(1500);
  await snap('add-step-sidebar');
});

await step('schedules-drawer', async () => {
  await openEditor();
  await page.getByTestId('workflow-schedules-pill').click({ timeout: 15000 });
  await settle(3000);
  await snap('schedules-drawer');
});

await step('workflow-header-menu', async () => {
  await openEditor();
  await page.getByTestId('workflow-menu').click({ timeout: 15000 });
  await settle(1500);
  await snap('workflow-header-menu', { x: 900, y: 0, width: 700, height: 430 });
});

for (const [name, rx, wait] of [
  ['workflow-shortcuts', /^Shortcuts$/i, 2000],
  ['version-history', /Version History/i, 3500],
  ['load-template', /Load Template/i, 3000],
]) {
  await step(name, async () => {
    await openEditor();
    await page.getByTestId('workflow-menu').click({ timeout: 15000 });
    await settle(1500);
    await page.getByText(rx).first().click({ timeout: 8000 });
    await settle(wait);
    await snap(name);
  });
}

await browser.close();
fs.writeFileSync(`${OUT}/_results.txt`, log.join('\n'));
console.log(`\n${log.filter(l => l.startsWith('ok')).length}/${log.length} captured`);
