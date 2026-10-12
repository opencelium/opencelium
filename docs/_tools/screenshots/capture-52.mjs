/**
 * Regenerates the 5.2 documentation screenshots — onboarding tour, help menu,
 * workflow tutorial, field links, minimap, the delete/remap dialog, multi-select,
 * the JSON editor, "Use Another Connector", the IF reorder handles, the jump
 * picking bar and connector duplication. Companion to capture.mjs (5.0) and
 * capture-51.mjs (5.1); the conventions in README.md apply here too.
 *
 * Usage
 *   BASE=http://127.0.0.1 OC_USER=admin@opencelium.io OC_PASS=1234 \
 *   OC_LINKS_WF=1 OC_MINIMAP_WF=42 node capture-52.mjs
 *
 * Safety
 *   Nothing is saved and nothing is executed. Every dialog is opened for its
 *   shot and cancelled; the delete dialog is answered with Cancel; the editor is
 *   reopened per shot, which discards anything left on the canvas. The workflow
 *   tutorial runs against its own in-browser backend. A request guard prints
 *   every non-GET call to /api so an unexpected write is visible in the log.
 *
 *   The onboarding tour's progress lives only in the browser's localStorage, so
 *   the onboarding shots use a fresh context and leave no trace on the server.
 *   Do not click a theme card in it — the theme IS stored on the server.
 */
import { chromium } from 'playwright-core';
import fs from 'node:fs';

const EXEC = process.env.CHROMIUM
  || '/root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome';
const BASE = process.env.BASE || 'http://127.0.0.1';
const USER = process.env.OC_USER || 'admin@opencelium.io';
const PASS = process.env.OC_PASS || '1234';
// A small workflow whose methods read each other's fields (direct references
// and transformations), so the field-links lens has something to draw.
const LINKS_WF = process.env.OC_LINKS_WF || '1';
// A large workflow with validation problems and IF blocks with several
// conditions — the minimap pager and the reorder handles need both.
const BIG_WF = process.env.OC_MINIMAP_WF || '42';
const OUT = process.env.OUT || 'out52';
const ONLY = process.env.ONLY ? process.env.ONLY.split(',') : null;

fs.mkdirSync(OUT, { recursive: true });
const log = [];
const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox', '--disable-dev-shm-usage'] });

async function newPage({ onboarding = false } = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 950 }, deviceScaleFactor: 2 });
  // Mark the onboarding tour as done, or it covers every page for an admin.
  if (!onboarding) await ctx.addInitScript(() => {
    for (let id = 1; id <= 50; id++) localStorage.setItem(`opencelium:onboarding:${id}`,
      JSON.stringify({ userId: id, stepId: 'welcome', status: 'completed', checklistDismissed: true }));
  });
  const page = await ctx.newPage();
  page.on('request', r => {
    if (r.method() !== 'GET' && r.url().includes('/api/') && !r.url().endsWith('/api/login')) {
      console.log(`     ${r.method()} ${r.url()}`);
    }
  });
  return page;
}

let page = await newPage();
const settle = async ms => { await page.waitForTimeout(ms); await page.waitForLoadState('networkidle').catch(() => {}); };
const snap = (n, clip) => page.screenshot(clip ? { path: `${OUT}/${n}.png`, clip } : { path: `${OUT}/${n}.png` });
const boxOf = async (loc, pad = 12) => {
  const b = await loc.boundingBox();
  return { x: Math.max(0, b.x - pad), y: Math.max(0, b.y - pad), width: b.width + 2 * pad, height: b.height + 2 * pad };
};

async function step(name, fn) {
  if (ONLY && !ONLY.includes(name)) return;
  try { await fn(); log.push(`ok   ${name}`); console.log(`ok   ${name}`); }
  catch (e) { log.push(`FAIL ${name}: ${e.message.split('\n')[0].slice(0, 160)}`); console.log(`FAIL ${name}: ${e.message.split('\n')[0].slice(0, 160)}`); }
}

async function login() {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await page.getByTestId('login-email').fill(USER);
  await page.getByTestId('login-password').fill(PASS);
  await page.getByTestId('login-submit').click();
  await page.waitForURL(u => !u.pathname.startsWith('/login'), { timeout: 60000 });
  await settle(2000);
}

async function openEditor(id) {
  await page.goto(`${BASE}/workflow/update/${id}`, { waitUntil: 'networkidle' });
  await settle(6500);
}
const nodeNamed = name => page.locator('.react-flow__node', { hasText: name }).first();
const parkPointer = async () => { await page.mouse.move(1000, 880); await settle(500); };
const cancelDialog = async () => {
  const c = page.locator('.ant-modal').getByRole('button', { name: 'Cancel' }).last();
  if (await c.isVisible().catch(() => false)) await c.click();
  await settle(500);
};

// ---------------------------------------------------------------- onboarding
await step('onboarding', async () => {
  const p = page;
  page = await newPage({ onboarding: true });
  try { await onboardingShots(); } finally { await page.context().close(); page = p; }
});

async function onboardingShots() {
  await login();
  await settle(4000);
  const tip = page.locator('.onboarding-tooltip').first();
  await tip.waitFor({ timeout: 20000 });
  await snap('OC5_onboarding-welcome');
  await snap('OC5_onboarding-welcome-card', await boxOf(tip, 0));

  // Walk forward with the tour's own Next button only — a theme card would
  // write the theme preference to the server.
  await page.getByTestId('onboarding-tour-primary').click(); await settle(1200);
  const counter = () => page.locator('.onboarding-tooltip__counter').first().innerText().catch(() => '');
  for (let i = 0; i < 6 && !(await counter()).startsWith('6'); i++) {
    if ((await counter()).startsWith('4')) await snap('OC5_onboarding-palette');
    await page.getByTestId('onboarding-tour-primary').click({ timeout: 5000 }); await settle(1500);
  }
  // On an instance that already has API definitions the step only lists them;
  // "Add another API definition" brings up the three ways to add one.
  if (!(await page.getByTestId('onboarding-invoker-git').isVisible().catch(() => false))) {
    await page.getByRole('button', { name: 'Add another API definition' }).click(); await settle(1500);
  }
  await page.getByTestId('onboarding-invoker-git').waitFor({ timeout: 5000 });
  await snap('OC5_onboarding-api-definitions');
  await page.getByTestId('onboarding-tour-primary').click({ timeout: 5000 }).catch(() => {}); await settle(1500);
  if ((await counter()).startsWith('7')) await snap('OC5_onboarding-connector');

  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' }); await settle(3000);
  const pill = page.getByTestId('onboarding-checklist-open');
  if (await pill.isVisible().catch(() => false)) await pill.click();
  await settle(800);
  const list = page.locator('.onboarding-checklist').first();
  await list.waitFor({ timeout: 5000 });
  await snap('OC5_onboarding-checklist', await boxOf(list, 16));
}

await login();

await step('help-menu', async () => {
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' }); await settle(3000);
  await page.getByTestId('topbar-help').click(); await settle(800);
  const menu = page.locator('.topbar-help-menu').first();
  const m = await menu.boundingBox(), t = await page.getByTestId('topbar-help').boundingBox();
  const x = Math.min(m.x, t.x) - 16, y = Math.min(m.y, t.y) - 10;
  await snap('OC5_help-menu', { x, y, width: Math.max(m.x + m.width, t.x + t.width) - x + 16, height: m.y + m.height - y + 16 });
  await page.keyboard.press('Escape');
});

// ---------------------------------------------------------------- field links
await step('field-links-lens', async () => {
  await openEditor(LINKS_WF);
  await page.getByTestId('workflow-binding-lens-toggle').click(); await settle(1200);
  // Pin the method that both receives and provides, so arcs run both ways.
  const badges = page.locator('[data-testid^="workflow-binding-badge-"]');
  const n = await badges.count();
  let best = badges.first();
  for (let i = 0; i < n; i++) if ((await badges.nth(i).innerText()).includes('↓') && (await badges.nth(i).innerText()).includes('↑')) best = badges.nth(i);
  await best.click(); await settle(1500);
  await parkPointer();
  await snap('OC5_field-links-lens', { x: 240, y: 0, width: 1360, height: 440 });
  await snap('OC5_field-links-legend', await boxOf(page.getByTestId('workflow-binding-lens-legend'), 6));
});

await step('field-links-list', async () => {
  await openEditor(LINKS_WF);
  await page.getByTestId('workflow-binding-table-toggle').click(); await settle(1200);
  const panel = page.getByTestId('workflow-binding-table-panel');
  await snap('OC5_field-links-list', await boxOf(panel, 0));
});

await step('field-link-drawer', async () => {
  await openEditor(LINKS_WF);
  await page.getByTestId('workflow-binding-lens-toggle').click(); await settle(1000);
  // A reference arc opens the drawer directly; take the first transformation one.
  await page.getByTestId('workflow-binding-table-toggle').click(); await settle(1200);
  const panel = page.getByTestId('workflow-binding-table-panel');
  await page.getByTestId('workflow-binding-table-toggle-all').click().catch(() => {});
  await settle(600);
  await panel.locator('tbody tr', { hasText: 'updCheckMKLabel' }).first().click(); await settle(1500);
  const drawer = page.getByTestId('workflow-binding-drawer');
  await drawer.waitFor({ timeout: 5000 });
  await snap('OC5_field-link-drawer', await boxOf(drawer, 0));
});

// ---------------------------------------------------------------- minimap
await step('minimap', async () => {
  await openEditor(BIG_WF);
  const mm = page.getByTestId('workflow-minimap');
  await page.getByTestId('workflow-minimap-issue-details-toggle').click().catch(() => {});
  await page.evaluate(() => document.activeElement && document.activeElement.blur());
  await parkPointer(); await settle(1200);
  await snap('OC5_minimap', await boxOf(mm, 10));
  await snap('OC5_minimap-editor');
});

// ---------------------------------------------------------------- delete + remap
await step('delete-remap', async () => {
  await openEditor(LINKS_WF);
  await nodeNamed('getCheckMKInfo').click(); await settle(600);
  await page.keyboard.press('Delete'); await settle(1500);
  const dlg = page.getByTestId('confirm-dialog');
  await dlg.waitFor({ timeout: 5000 });
  await parkPointer();
  const modal = page.locator('.ant-modal:has([data-testid="confirm-dialog"])').first();
  await snap('OC5_delete-remap', await boxOf(modal, 0));
  await page.getByTestId('confirm-dialog-cancel').click(); await settle(800);
});

// ---------------------------------------------------------------- multi-select
await step('multi-select', async () => {
  await openEditor(LINKS_WF);
  const a = await nodeNamed('GetHostConfig').boundingBox();
  const b = await nodeNamed('getLabelDialogData').boundingBox();
  await page.keyboard.down('Shift');
  await page.mouse.move(a.x - 40, a.y - 40);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width + 40, b.y + b.height + 50, { steps: 20 });
  await snap('OC5_box-select-drawing', { x: 240, y: 70, width: 1360, height: 420 });
  await page.mouse.up();
  await page.keyboard.up('Shift');
  await settle(800); await parkPointer();
  await snap('OC5_multi-select', { x: 240, y: 70, width: 1360, height: 420 });
});

// ---------------------------------------------------------------- header menu, shortcuts, JSON
await step('header-menu', async () => {
  await openEditor(LINKS_WF);
  await page.getByTestId('workflow-menu').click(); await settle(800);
  const items = page.locator('[data-testid^="workflow-menu-item-"]');
  const boxes = [];
  for (let i = 0; i < await items.count(); i++) boxes.push(await items.nth(i).boundingBox());
  const x = Math.min(...boxes.map(b => b.x)) - 14, y = Math.min(...boxes.map(b => b.y)) - 14;
  const r = Math.max(...boxes.map(b => b.x + b.width)) + 14, btm = Math.max(...boxes.map(b => b.y + b.height)) + 14;
  await snap('OC5_workflow-header-menu', { x, y, width: r - x, height: btm - y });
});

await step('shortcuts', async () => {
  await openEditor(LINKS_WF);
  await page.getByTestId('workflow-menu').click(); await settle(600);
  await page.getByTestId('workflow-menu-item-shortcuts').click(); await settle(1200);
  const modal = page.locator('.ant-modal:has(.shortcutsList), .ant-modal:has(.shortcutsGroup)').first();
  await snap('OC5_shortcuts-dialog', await boxOf(modal, 0));
});

await step('json-editor', async () => {
  await openEditor(LINKS_WF);
  await page.getByTestId('workflow-menu').click(); await settle(600);
  await page.getByTestId('workflow-menu-item-edit-json').click(); await settle(2500);
  const modal = page.locator('.ant-modal:has([data-testid="workflow-json-dialog"])').first();
  await snap('OC5_json-editor', await boxOf(modal, 0));
  await page.getByTestId('workflow-json-mode-toggle').getByText('Raw').click().catch(() => {});
  await settle(1500);
  await snap('OC5_json-editor-raw', await boxOf(modal, 0));
  await page.getByTestId('workflow-json-cancel').click();
});

// ---------------------------------------------------------------- context menu, other connector
await step('context-menu', async () => {
  await openEditor(LINKS_WF);
  await nodeNamed('getCheckMKInfo').click({ button: 'right' }); await settle(800);
  const menu = page.getByTestId('workflow-context-menu');
  await snap('OC5_node-context-menu', await boxOf(menu, 10));
  await page.getByTestId('workflow-context-menu-change-connector').click(); await settle(1200);
  const modal = page.locator('.ant-modal:has([data-testid="workflow-change-connector-dialog"])').first();
  await snap('OC5_use-another-connector', await boxOf(modal, 0));
  await page.getByTestId('workflow-change-connector-cancel').click();
});

// ---------------------------------------------------------------- jumps
await step('jump-picking', async () => {
  await openEditor(LINKS_WF);
  await nodeNamed('GetHostConfig').click(); await settle(800);
  await page.getByTestId('workflow-node-add-joint').click(); await settle(1200);
  await parkPointer();
  await snap('OC5_jump-picking-bar', { x: 240, y: 70, width: 1360, height: 420 });
  await page.getByTestId('workflow-joint-picking-cancel').click();
});

// ---------------------------------------------------------------- IF reorder
await step('if-reorder', async () => {
 for (const wf of (process.env.OC_IF_WFS || '22,21,20,5,2,42,182').split(',')) {
  await openEditor(wf);
  const ifs = page.locator('.react-flow__node', { hasText: /^If/ });
  const n = await ifs.count();
  for (let i = 0; i < n; i++) {
    await ifs.nth(i).dblclick(); await settle(1500);
    const handles = page.getByTestId('workflow-condition-drag-handle');
    if (await handles.count() >= 2) {
      const modal = page.locator('.ant-modal:has([data-testid="workflow-condition-builder"])').first();
      await handles.nth(1).hover(); await settle(600);
      await snap('OC5_if-reorder', await boxOf(modal, 0));
      return;
    }
    await page.keyboard.press('Escape'); await cancelDialog();
    await openEditor(wf);
  }
 }
  throw new Error('no IF with two or more conditions');
});

// ---------------------------------------------------------------- connectors
await step('connector-duplicate', async () => {
  await page.goto(`${BASE}/connector`, { waitUntil: 'networkidle' }); await settle(2500);
  await page.getByTestId('connector-duplicate-trigger').first().click(); await settle(2000);
  const modal = page.locator('.ant-modal:has([data-testid="connector-duplicate-dialog"])').first();
  await snap('OC5_connector-duplicate', await boxOf(modal, 0));
  await page.keyboard.press('Escape'); await settle(500);
});

// ---------------------------------------------------------------- workflow tutorial
await step('workflow-tutorial', async () => {
  await page.goto(`${BASE}/workflow/create`, { waitUntil: 'networkidle' }); await settle(4000);
  await page.keyboard.press('Control+k'); await settle(800);
  await page.keyboard.type('help work', { delay: 40 }); await settle(1000);
  await page.keyboard.press('Enter'); await settle(3000);
  const pill = page.locator('.workflow-tutorial-pill').first();
  await pill.waitFor({ timeout: 10000 });
  await snap('OC5_workflow-tutorial');
});

console.log('\n' + log.join('\n'));
await browser.close();
