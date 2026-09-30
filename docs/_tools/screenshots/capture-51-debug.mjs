/**
 * Shoots the 5.1 debug controls, which only exist while a test run is playing:
 * the pause / step-forward / speed panel, and the loop node's jump-to-iteration
 * input. Split out of capture-51.mjs because — unlike every other shot — this
 * one EXECUTES a workflow.
 *
 * Usage
 *   OC_WORKFLOW='GetSwitches fast (static if-condition)' node capture-51-debug.mjs
 *
 * Choosing OC_WORKFLOW
 *   Only ever point this at a workflow that is safe to execute for real. Check
 *   what it actually calls before running it, e.g.
 *
 *     mongosh opencelium --quiet --eval '
 *       const d = db.connection.find({connection_id: NumberLong("20")})
 *                   .sort({_id:-1}).limit(1).toArray()[0];
 *       d.from_connector.method.forEach(m =>
 *         print(m.index, m.name, m.request.method, m.request.endpoint));'
 *
 *   The default is a benchmark workflow whose single call is the read-only
 *   i-doit RPC `cmdb.objects.read` (POST, because i-doit's API is JSON-RPC —
 *   the RPC method is what decides whether it writes, not the HTTP verb). A
 *   loop over the result gives a replay long enough to pause inside.
 *
 * The run is stopped again at the end. A test run also creates a temporary
 * connection and scheduler; those are cleaned up automatically, and
 * `DELETE /connection/test` clears any left behind by an interrupted run.
 */
import { chromium } from 'playwright-core';
import fs from 'node:fs';

const EXEC = process.env.CHROMIUM
  || '/root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome';
const BASE = process.env.BASE || 'http://127.0.0.1';
const USER = process.env.OC_USER || 'admin@opencelium.io';
const PASS = process.env.OC_PASS || '1234';
const WF = process.env.OC_WORKFLOW || 'GetSwitches fast (static if-condition)';
const OUT = process.env.OUT || 'out51';

fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const ctx = await browser.newContext({ viewport: { width: 1600, height: 950 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
const settle = async ms => { await page.waitForTimeout(ms); await page.waitForLoadState('networkidle').catch(() => {}); };
const snap = (n, clip) => page.screenshot(clip ? { path: `${OUT}/${n}.png`, clip } : { path: `${OUT}/${n}.png` });

await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
await page.getByTestId('login-email').fill(USER);
await page.getByTestId('login-password').fill(PASS);
await page.getByTestId('login-submit').click();
await page.waitForURL(u => !u.pathname.startsWith('/login'), { timeout: 60000 });

await page.goto(`${BASE}/workflow`, { waitUntil: 'networkidle' });
await settle(2500);
await page.locator('tr', { hasText: WF }).first().locator('svg').nth(2).click();
await page.waitForURL(/\/workflow\/update\//, { timeout: 30000 });
await settle(6000);

try {
  // Start in debug mode. The dialog appears because this context is fresh; if a
  // previous session suppressed it, the run starts in debug mode anyway.
  await page.locator('button.startNodeButton').first().click({ timeout: 15000 });
  const dialog = page.getByTestId('workflow-test-run-mode-dialog');
  if (await dialog.count()) {
    await page.getByTestId('workflow-test-run-mode-start-debug').click({ timeout: 10000 });
  }

  // Pause early — the replay drains in seconds on a short workflow and the
  // panel goes with it — then walk forward under our own control. Stepping is
  // deterministic, so this reaches the loop without racing the playback.
  const panel = page.getByTestId('workflow-test-debug-panel');
  await panel.waitFor({ timeout: 30000 });
  // Freeze almost immediately. Waiting longer risks the replay draining on a
  // short run, and everything after this is reached by stepping instead.
  await page.waitForTimeout(400);
  await page.getByTestId('workflow-test-pause-button').click({ timeout: 10000 });
  await settle(900);
  await page.mouse.move(250, 620); // no tooltip tail over the panel
  await settle(500);

  // Clip from the element's own box rather than guessed coordinates.
  const around = async (locator, pad) => {
    const b = await locator.boundingBox();
    if (!b) return null;
    return {
      x: Math.max(0, b.x - pad.left), y: Math.max(0, b.y - pad.top),
      width: Math.min(1600 - Math.max(0, b.x - pad.left), b.width + pad.left + pad.right),
      height: Math.min(950 - Math.max(0, b.y - pad.top), b.height + pad.top + pad.bottom),
    };
  };

  await snap('debug-controls', await around(panel, { left: 14, right: 14, top: 12, bottom: 12 }));

  // Step into the loop. Each press applies exactly one buffered line, so a
  // handful of them is enough to get past the first method and into iteration 1.
  const stepButton = page.getByTestId('workflow-test-step-forward-button');
  for (let i = 0; i < 40; i += 1) {
    // The button is disabled until the next line has actually been buffered,
    // so wait for it rather than treating "disabled" as "nothing left".
    if (await stepButton.isDisabled().catch(() => true)) {
      await page.waitForTimeout(250);
      if (i > 24) break;
      continue;
    }
    await stepButton.click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(300);
    if (await page.locator('[data-testid^="workflow-node-iteration-input-"]').count()) break;
    // Stop once a step is lit — that is the shot we want on the canvas.
    if (await page.locator('.nodeBodyTestRunActive').count() && i > 2) break;
  }
  await page.mouse.move(250, 640); // drop the step button's tooltip
  await settle(1000);

  await snap('debug-run', { x: 260, y: 70, width: 720, height: 470 });

  // The loop node exposes its iteration controls only while paused inside it.
  const iterationInput = page.locator('[data-testid^="workflow-node-iteration-input-"]').first();
  if (await iterationInput.count()) {
    const clip = await around(page.locator('.react-flow__node-loop').first(),
      { left: 190, right: 190, top: 110, bottom: 110 });
    if (clip) await snap('debug-loop-iteration', clip);
    console.log('ok debug-loop-iteration');
  } else {
    console.log('note: replay never paused inside a loop — no iteration shot');
  }
  console.log('ok debug shots');
} finally {
  // Always leave the instance idle.
  try {
    await page.locator('button.startNodeButton').first().click({ timeout: 8000 });
    await settle(3000);
  } catch { /* already idle */ }
  await browser.close();
}
