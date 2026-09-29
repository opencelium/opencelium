/**
 * Regenerates the 5.1 documentation screenshots (joints, comment boxes,
 * change history, debug mode) from a running OpenCelium instance. Companion to
 * capture.mjs, which covers the 5.0 shots; the conventions there apply here too.
 *
 * Usage
 *   BASE=http://127.0.0.1 OC_USER=admin@opencelium.io OC_PASS=1234 \
 *   node capture-51.mjs
 *
 * Safety
 *   This script NEVER starts a test run. The mode dialog is opened for its
 *   screenshot and dismissed without pressing either start button, and a guard
 *   after that shot fails the run if a debug panel ever appears. Screenshots of
 *   the live debug controls need a workflow that is safe to execute — see
 *   OC_RUN_WORKFLOW below — and are skipped unless you opt in explicitly.
 *
 *   Edits made to draw a joint or add a note stay in the editor and are never
 *   saved: every shot reopens the editor, which discards them.
 */
import { chromium } from 'playwright-core';
import fs from 'node:fs';

const EXEC = process.env.CHROMIUM
  || '/root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome';
const BASE = process.env.BASE || 'http://127.0.0.1';
const USER = process.env.OC_USER || 'admin@opencelium.io';
const PASS = process.env.OC_PASS || '1234';
// Needs at least three methods outside every loop, with something skippable
// between two of them, or the joint shots have nothing to show.
const WF = process.env.OC_WORKFLOW || 'Fetching all WATO folders from CheckMK';
const OUT = process.env.OUT || 'out51';

fs.mkdirSync(OUT, { recursive: true });
const log = [];

const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const ctx = await browser.newContext({ viewport: { width: 1600, height: 950 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();

const settle = async ms => { await page.waitForTimeout(ms); await page.waitForLoadState('networkidle').catch(() => {}); };
const snap = (n, clip) => page.screenshot(clip ? { path: `${OUT}/${n}.png`, clip } : { path: `${OUT}/${n}.png` });

async function step(name, fn) {
  try { await fn(); log.push(`ok   ${name}`); console.log(`ok   ${name}`); }
  catch (e) { log.push(`FAIL ${name}: ${e.message.split('\n')[0].slice(0, 140)}`); console.log(`FAIL ${name}: ${e.message.split('\n')[0].slice(0, 140)}`); }
}

async function login() {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await page.getByTestId('login-email').fill(USER);
  await page.getByTestId('login-password').fill(PASS);
  await page.getByTestId('login-submit').click();
  await page.waitForURL(u => !u.pathname.startsWith('/login'), { timeout: 60000 });
  await page.waitForLoadState('networkidle');
}

// A fresh editor per shot: Escape does not reliably dismiss antd overlays, and
// reopening also throws away the unsaved joint/note from the previous shot.
async function openEditor() {
  await page.goto(`${BASE}/workflow`, { waitUntil: 'networkidle' });
  await settle(2500);
  await page.locator('tr', { hasText: WF }).first().locator('svg').nth(2).click();
  await page.waitForURL(/\/workflow\/update\//, { timeout: 30000 });
  await settle(6000);
}

const node = id => page.getByTestId(`rf__node-${id}`);

// Parks the pointer on empty canvas. Leaving it on a node raises that node's
// connector tooltip, which then sits in the middle of the shot.
const parkPointer = async () => { await page.mouse.move(250, 820); await settle(700); };

// A note is created *above* its step, so on the top row of the canvas it lands
// off-screen and cannot be typed into. Pan the graph down first.
const panDown = async (dy = 220) => {
  await page.mouse.move(250, 700);
  await page.mouse.down();
  await page.mouse.move(250, 700 + dy, { steps: 15 });
  await page.mouse.up();
  await settle(1200);
};

await login();

// ---- node toolbar --------------------------------------------------------
await step('node-toolbar', async () => {
  await openEditor();
  await node('method-1').click();
  await parkPointer();
  await snap('node-toolbar', { x: 600, y: 60, width: 560, height: 300 });
});

// ---- joints --------------------------------------------------------------
// Target-picking mode: legal targets are highlighted, illegal ones carry a
// tooltip saying which rule they break.
await step('joint-picking', async () => {
  await openEditor();
  await node('method-0').click();
  await settle(1000);
  await page.getByTestId('workflow-node-add-joint').click({ timeout: 8000 });
  await settle(1500);
  await snap('joint-picking', { x: 380, y: 60, width: 1080, height: 480 });
});

await step('joint-invalid', async () => {
  await openEditor();
  await node('method-0').click();
  await settle(1000);
  await page.getByTestId('workflow-node-add-joint').click({ timeout: 8000 });
  await settle(1200);
  // A method nested in a loop the source is not in: "different loop scope".
  await node('method-2').hover();
  await settle(1800);
  await snap('joint-invalid', { x: 380, y: 60, width: 1080, height: 420 });
});

// The graph lays sequential steps out on one row, so a joint between them runs
// along the same line as the edges it passes — which is exactly what a user
// sees. Crop to the row so the green line is the subject of the shot.
await step('joint-edge', async () => {
  await openEditor();
  await node('method-0').click();
  await settle(1000);
  await page.getByTestId('workflow-node-add-joint').click({ timeout: 8000 });
  await settle(1200);
  await node('method-3').click();
  await settle(1800);
  await page.mouse.click(300, 780); // deselect, so the shot shows the joint alone
  await parkPointer();
  await snap('joint-edge', { x: 380, y: 110, width: 1100, height: 250 });
});

// ---- comment box ---------------------------------------------------------
await step('comment-node', async () => {
  await openEditor();
  await panDown();
  await node('method-1').click();
  await settle(1000);
  await page.getByTestId('workflow-node-add-comment').click({ timeout: 8000 });
  await settle(1500);
  const area = page.locator('.commentNodeText').first();
  await area.click();
  await area.type('The folder list is fetched twice on purpose: this second call has '
    + 'to see the deletions the loop above made.', { delay: 12 });
  await settle(900);
  await page.mouse.click(300, 820);
  await parkPointer();
  await snap('comment-node', { x: 520, y: 90, width: 900, height: 470 });
});

// ---- change history ------------------------------------------------------
// Needs real entries, so make a few edits first. None of them are saved.
await step('change-history', async () => {
  await openEditor();
  await panDown();

  // A note, a move and a joint, so the list shows several kinds of entry.
  await node('method-1').click();
  await settle(900);
  await page.getByTestId('workflow-node-add-comment').click({ timeout: 8000 });
  await settle(1300);
  const area = page.locator('.commentNodeText').first();
  await area.click();
  await area.type('Second pass has to see the deletions.', { delay: 12 });
  await settle(1000);
  await page.mouse.click(300, 820);
  await settle(700);

  const box = await node('method-3').boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 + 150, { steps: 15 });
  await page.mouse.up();
  await settle(1300);

  await node('method-0').click();
  await settle(900);
  await page.getByTestId('workflow-node-add-joint').click({ timeout: 8000 });
  await settle(900);
  await node('method-3').click();
  await settle(1500);

  await page.getByTestId('workflow-menu').click({ timeout: 15000 });
  await settle(1200);
  await page.getByText(/Change History/i).first().click({ timeout: 8000 });
  await settle(2200);
  await snap('change-history', { x: 1010, y: 0, width: 590, height: 600 });
});

// ---- test run mode dialog ------------------------------------------------
// Opening the dialog is safe: the run only starts when one of its two buttons
// is pressed. This shot dismisses it with Escape and then verifies that nothing
// began executing.
await step('test-run-mode-dialog', async () => {
  await openEditor();
  await page.locator('button.startNodeButton').first().click({ timeout: 15000 });
  await page.getByTestId('workflow-test-run-mode-dialog').waitFor({ timeout: 15000 });
  await settle(1500);
  await snap('test-run-mode-dialog', { x: 520, y: 8, width: 560, height: 368 });
  await page.keyboard.press('Escape');
  await settle(1500);
  if (await page.getByTestId('workflow-test-debug-panel').count()) {
    throw new Error('ABORT: a test run started — stop it in the UI and check the instance');
  }
});

await browser.close();
fs.writeFileSync(`${OUT}/_results.txt`, log.join('\n'));
console.log(`\n${log.filter(l => l.startsWith('ok')).length}/${log.length} captured -> ${OUT}`);
