/**
 * Regenerates the 5.3 documentation screenshots — global variables, the request
 * and script playgrounds, the problems panel, cross-workflow paste, reference
 * operations, the Send Notification step, the schedule calendar, the changelog
 * page, the sign-in page and the user / password-link dialogs. Companion to
 * capture.mjs (5.0), capture-51.mjs and capture-52.mjs; README.md applies.
 *
 * Usage
 *   BASE=http://127.0.0.1:8053 OC_USER=admin@opencelium.io OC_PASS=1234 \
 *   OC_WF=182 OC_DEMO_USER=5 node capture-53.mjs
 *   ONLY=calendar,gv-list node capture-53.mjs
 *
 * Instance
 *   Shot against a 5.3 backend running on a COPY of the database with the
 *   Quartz scheduler switched off (spring.quartz.auto-startup: false) and
 *   opencelium.online-services.active: false, and with demo data from
 *   seed-53.mjs (global variables, schedules, a demo user). See README.md.
 *
 * Safety
 *   Nothing is executed against a real system. The playground's Send button and
 *   the cURL panel are never touched (Send calls the real API, the cURL panel
 *   runs the connector's authentication and prints real credentials). The
 *   notification dialog's "Send test message" is never pressed. "Run now" on a
 *   calendar run card is never pressed. Editor shots reopen the editor, which
 *   discards unsaved edits; dialogs are cancelled. The script test run of a
 *   global variable and the Script Playground run in the server's sandbox only.
 *   A request guard prints every non-GET call to /api.
 */
import { chromium } from 'playwright-core';
import fs from 'node:fs';

const EXEC = process.env.CHROMIUM || '/root/.cache/ms-playwright/chromium-1194/chrome-linux/chrome';
const BASE = process.env.BASE || 'http://127.0.0.1:8053';
const USER = process.env.OC_USER || 'admin@opencelium.io';
const PASS = process.env.OC_PASS || '1234';
// A workflow with a loop, IFs and several connector methods that read each other.
const WF = process.env.OC_WF || '182';
// A second, empty workflow to paste into (created by the script if not given).
let WF_B = process.env.OC_WF_B || '';
// A user without personal data (seeded "demo.operator") for the password-link dialog.
const DEMO_USER = process.env.OC_DEMO_USER || '5';
const OUT = process.env.OUT || 'out53';
const ONLY = process.env.ONLY ? process.env.ONLY.split(',') : null;
const NEW_FEATURES = ['workflow-template-json-edit', 'enhancement-script-sandbox', 'workflow-reference-operations',
  'workflow-connector-http-method', 'workflow-header-user-actions', 'workflow-test-method', 'workflow-problems',
  'sidebar-back-to-main-menu', 'changelog', 'global-variables'];

fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox', '--disable-dev-shm-usage'] });

async function newPage({ width = 1600, height = 950 } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 2 });
  await ctx.addInitScript(features => {
    for (let id = 1; id <= 50; id++) localStorage.setItem(`opencelium:onboarding:${id}`,
      JSON.stringify({ userId: id, stepId: 'welcome', status: 'completed', checklistDismissed: true }));
    localStorage.setItem('opencelium:new-features:dismissed', JSON.stringify(features));
  }, NEW_FEATURES);
  const page = await ctx.newPage();
  page.on('request', r => {
    if (r.method() !== 'GET' && r.url().includes('/api/') && !r.url().endsWith('/api/login')) console.log(`     ${r.method()} ${r.url()}`);
  });
  return page;
}

let page = await newPage();
const settle = async ms => { await page.waitForTimeout(ms); await page.waitForLoadState('networkidle').catch(() => {}); };
// The demo workflow's description carries an automation marker; keep it out of the shots.
const sanitize = () => page.evaluate(() => {
  for (const el of document.querySelectorAll('body *')) {
    if (el.children.length === 0 && el.textContent.includes('dg-automation')) el.textContent = 'Demo workflow';
  }
}).catch(() => {});
const snap = async (n, clip) => { await sanitize(); await page.screenshot(clip ? { path: `${OUT}/${n}.png`, clip } : { path: `${OUT}/${n}.png` }); };
const boxOf = async (loc, pad = 12) => {
  const b = await loc.boundingBox();
  const vp = page.viewportSize();
  const x = Math.max(0, b.x - pad), y = Math.max(0, b.y - pad);
  return { x, y, width: Math.min(b.width + 2 * pad, vp.width - x), height: Math.min(b.height + 2 * pad, vp.height - y) };
};
const byId = id => page.getByTestId(id).first();
const log = [];
async function step(name, fn) {
  if (ONLY && !ONLY.includes(name)) return;
  try { await fn(); log.push(`ok   ${name}`); console.log(`ok   ${name}`); }
  catch (e) {
    const m = e.message.split('\n')[0].slice(0, 200);
    log.push(`FAIL ${name}: ${m}`); console.log(`FAIL ${name}: ${m}`);
    await page.screenshot({ path: `${OUT}/_fail-${name}.png` }).catch(() => {});
  }
}

async function login(p = page) {
  await p.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await p.getByTestId('login-email').fill(USER);
  await p.getByTestId('login-password').fill(PASS);
  await p.getByTestId('login-submit').click();
  await p.waitForURL(u => !u.pathname.startsWith('/login'), { timeout: 60000 });
  await p.waitForTimeout(2000);
}
const go = async (path, ms = 3500) => { await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' }); await settle(ms); };
const openEditor = async (id = WF) => { await go(`/workflow/update/${id}`, 6500); };
const methodNode = slug => page.locator(`[data-testid="workflow-node-method-${slug}"]`).first();
const parkPointer = async () => { await page.mouse.move(1590, 940); await settle(400); };
const closeModal = async () => {
  for (const name of ['Cancel', 'Close']) {
    const b = page.locator('.ant-modal-wrap:visible').getByRole('button', { name, exact: true }).last();
    if (await b.isVisible().catch(() => false)) { await b.click(); await settle(500); return; }
  }
  await page.keyboard.press('Escape'); await settle(500);
};
const modal = () => page.locator('.ant-modal-wrap:visible .ant-modal').last();

// ------------------------------------------------------------------ sign-in
await step('login', async () => {
  const p = page;
  page = await newPage();
  try {
    await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' }); await settle(1500);
    await snap('OC5_login');
  } finally { await page.context().close(); page = p; }
});

await login();

// --------------------------------------------------------- help + changelog
await step('help-menu', async () => {
  await go('/', 3000);
  await byId('topbar-help').click(); await settle(800);
  await parkPointer();
  const pop = page.locator('.ant-popover:visible').last();
  await snap('OC5_help-menu', await boxOf(pop, 8));
  await page.keyboard.press('Escape');
});

await step('changelog', async () => {
  await go('/changelog', 3000);
  await byId('changelog-current').waitFor();
  await parkPointer();
  await snap('OC5_changelog-page');
});

await step('dashboard-card', async () => {
  await go('/', 9000);
  const card = byId('dashboard-schedule-calendar-card');
  await card.waitFor();
  await snap('OC5_dashboard-schedule-card', await boxOf(card, 6));
});

// --------------------------------------------------------- global variables
await step('gv-list', async () => {
  await go('/global-variable', 3000);
  await byId('global-variable-list').waitFor();
  await parkPointer();
  await snap('OC5_global-variable-list');
});

await step('gv-create', async () => {
  await go('/global-variable', 2500);
  await byId('global-variable-create').click(); await settle(1500);
  const dlg = modal();
  await dlg.getByRole('textbox').first().fill('apiTimeoutSeconds');
  const desc = dlg.locator('textarea').first();
  if (await desc.isVisible().catch(() => false)) await desc.fill('Timeout used by every HTTP step');
  await parkPointer();
  await snap('OC5_global-variable-create', await boxOf(dlg, 0));
  // Mutable: choose the kind, go to the value step.
  await dlg.getByRole('radio', { name: /Mutable/ }).check({ force: true }); await settle(500);
  await dlg.getByRole('textbox').first().fill('lastRunCursor');
  await dlg.getByRole('button', { name: /Next/ }).last().click(); await settle(1200);
  await dlg.locator('.ant-select').first().click(); await settle(600);
  await page.locator('.ant-select-dropdown:visible .ant-select-item-option').first().click(); await settle(400);
  await page.keyboard.press('Escape'); await settle(400);
  await snap('OC5_global-variable-mutable', await boxOf(dlg, 0));
  await closeModal();
});

await step('gv-script', async () => {
  await go('/global-variable', 2500);
  await byId('global-variable-row-action-update-5').click(); await settle(1800);
  const dlg = modal();
  await dlg.getByText('Value or code', { exact: true }).first().click().catch(() => {});
  await settle(800);
  await dlg.getByText('Test', { exact: true }).first().click(); await settle(800);
  // The test arguments use the same inputs as the Script Playground.
  await byId('script-playground-var-toggle-iso').click(); await settle(600);
  await byId('script-playground-var-mode-iso-text').click().catch(() => {}); await settle(300);
  await byId('script-playground-var-iso').locator('textarea, input').first().fill('2026-11-25T06:00:00Z')
    .catch(async () => { await byId('script-playground-var-iso').fill('2026-11-25T06:00:00Z'); });
  await byId('global-variable-script-test-run').click(); await settle(2500);
  await parkPointer();
  await snap('OC5_global-variable-script', await boxOf(dlg, 0));
  await closeModal();
});

await step('gv-details', async () => {
  await go('/global-variable', 2500);
  await byId('global-variable-row-action-details-4').click(); await settle(2000);
  await byId('global-variable-details').waitFor();
  const dlg = modal();
  await parkPointer();
  await snap('OC5_global-variable-details', await boxOf(dlg, 0));
  await closeModal();
});

// ----------------------------------------------------------------- schedules
for (const view of ['week', 'month', 'agenda']) {
  await step(`calendar-${view}`, async () => {
    await go('/schedule', 3000);
    await byId(`schedule-calendar-view-${view}`).click(); await settle(1800);
    await byId('schedule-calendar').waitFor();
    await parkPointer();
    await snap(`OC5_schedule-calendar-${view}`);
  });
}

await step('run-card', async () => {
  await go('/schedule', 3000);
  await byId('schedule-calendar-view-week').click(); await settle(1800);
  await page.locator('[data-testid^="schedule-calendar-event-"]').first().click(); await settle(1000);
  const card = page.locator('[data-testid^="schedule-run-card-"]').first();
  await card.waitFor();
  await snap('OC5_schedule-run-card', await boxOf(card, 10));
  await page.keyboard.press('Escape');
});

await step('cron-preview', async () => {
  await go('/schedule', 3000);
  // The Schedule column's readable chip opens "Edit Cron Expression" with the preview.
  await page.getByText('Daily at 02:00', { exact: true }).first().click(); await settle(1800);
  const prev = byId('schedule-cron-preview');
  await prev.waitFor();
  await snap('OC5_schedule-cron-preview', await boxOf(modal(), 0));
  await closeModal();
});

// ---------------------------------------------------------------- users
await step('user-wizard', async () => {
  await go('/user/create', 3000);
  const boxes = page.getByRole('textbox');
  await boxes.nth(0).fill('Demo'); await boxes.nth(1).fill('Operator');
  await page.getByRole('button', { name: 'Next', exact: true }).click(); await settle(1200);
  // The browser may autofill the sign-in credentials here; show an account without email instead.
  for (const f of await page.locator('form input:not([type=checkbox]):not([type=radio])').all()) await f.fill('').catch(() => {});
  await page.getByRole('textbox').nth(1).fill('demo.operator').catch(() => {});
  await parkPointer();
  await snap('OC5_user-wizard');
});

await step('password-link', async () => {
  await go('/user', 3000);
  await byId(`user-row-action-reset-link-${DEMO_USER}`).click(); await settle(1500);
  await parkPointer();
  await snap('OC5_password-link-dialog', await boxOf(modal(), 0));
  await closeModal();
});

// ---------------------------------------------------------------- editor
await step('context-menu', async () => {
  await openEditor();
  await methodNode('cmdb-objects-read').click({ button: 'right' }); await settle(900);
  const menu = byId('workflow-context-menu');
  await menu.waitFor();
  await snap('OC5_node-context-menu', await boxOf(menu, 16));
});

await step('request-playground', async () => {
  await openEditor();
  await methodNode('cmdb-objects-read').click({ button: 'right' }); await settle(900);
  await byId('workflow-context-menu-try-request').click(); await settle(3000);
  await byId('request-playground-dialog').waitFor();
  await byId('request-playground-response-empty').waitFor();
  await parkPointer();
  await snap('OC5_request-playground');
  await byId('request-playground-close').click();
});

await step('global-writes', async () => {
  await openEditor();
  await methodNode('cmdb-objects-read').click({ button: 'right' }); await settle(900);
  await byId('workflow-context-menu-write-globals').click(); await settle(1500);
  const dlg = byId('workflow-global-writes-dialog');
  await dlg.waitFor();
  await byId('workflow-global-writes-add').click(); await settle(800);
  await parkPointer();
  await snap('OC5_global-writes-dialog', await boxOf(page.locator('.ant-modal:visible').last(), 0));
  await closeModal();
});

await step('problems', async () => {
  await openEditor();
  // An IF without a condition is an error; the editor is reopened later, so it is never saved.
  await page.locator('[data-testid="workflow-add-step-right"]').last().click({ force: true }); await settle(1000);
  await byId('workflow-sidebar-main-item-operator').click(); await settle(800);
  await byId('workflow-sidebar-operator-item-if').click(); await settle(1500);
  await page.keyboard.press('Escape'); await settle(600);
  await byId('workflow-problems-badge').click(); await settle(1500);
  await byId('workflow-problems-panel').waitFor();
  await parkPointer();
  await snap('OC5_problems-panel');
});

await step('notification', async () => {
  await openEditor();
  await page.locator('[data-testid="workflow-add-step-right"]').last().click({ force: true }); await settle(1200);
  await byId('workflow-sidebar-main-item-notification').click(); await settle(2000);
  const dlg = byId('notification-dialog');
  await dlg.waitFor();
  await parkPointer();
  await snap('OC5_notification-tool');
  await byId('notification-tool-slack').click(); await settle(600);
  await byId('notification-dialog-next').click(); await settle(1000);
  await byId('notification-webhook-url').locator('input, textarea').first().fill('https://hooks.slack.com/services/T0000000/B0000000/XXXXXXXXXXXXXXXX')
    .catch(async () => { await byId('notification-webhook-url').fill('https://hooks.slack.com/services/T0000000/B0000000/XXXXXXXXXXXXXXXX'); });
  await byId('notification-dialog-next').click(); await settle(1200);
  const fields = byId('notification-dialog').getByRole('textbox');
  const texts = ['Sync to i-doit finished', 'CMDB sync', '*Objects created:* see the run log'];
  for (let i = 0; i < texts.length; i++) await fields.nth(i + 1).fill(texts[i]).catch(() => {});
  await settle(800); await parkPointer();
  await snap('OC5_notification-message');
});

await step('script-playground', async () => {
  await openEditor();
  await methodNode('cmdb-object-create').click({ button: 'right' }); await settle(900);
  await byId('workflow-context-menu-edit-body').click(); await settle(2000);
  await byId('body-reference-chip').click(); await settle(1500);
  await byId('script-playground-toggle').click(); await settle(1500);
  await byId('script-playground-var-toggle-VAR_0').click(); await settle(600);
  await byId('script-playground-var-mode-VAR_0-text').click().catch(() => {}); await settle(400);
  await byId('script-playground-var-VAR_0').locator('textarea, input').first().fill('SW-ACCESS-01')
    .catch(async () => { await byId('script-playground-var-VAR_0').fill('SW-ACCESS-01'); });
  await byId('script-playground-run').click(); await settle(2500);
  await parkPointer();
  await snap('OC5_script-playground');
});

async function openReferenceGenerator() {
  await openEditor();
  await methodNode('cmdb-object-create').click({ button: 'right' }); await settle(900);
  await byId('workflow-context-menu-edit-url').click(); await settle(1800);
  await byId('workflow-url-insert-reference').click(); await settle(1200);
  const gen = byId('workflow-reference-generator');
  await gen.locator('.ant-select').nth(1).click(); await settle(800);
  await page.locator('.ant-select-dropdown:visible .ant-select-item-option', { hasText: 'GetObjects' }).first().click(); await settle(1000);
  return gen;
}

await step('reference-operations', async () => {
  const gen = await openReferenceGenerator();
  await gen.locator('.ant-select').last().click(); await settle(600);
  await settle(1200);
  await snap('OC5_reference-operations', { x: 230, y: 90, width: 1160, height: 560 });
});

await step('gv-picker', async () => {
  await openEditor();
  await methodNode('cmdb-object-create').click({ button: 'right' }); await settle(900);
  await byId('workflow-context-menu-edit-url').click(); await settle(1800);
  await byId('workflow-url-insert-reference').click(); await settle(1200);
  await byId('workflow-reference-source').click(); await settle(700);
  await page.locator('.ant-select-dropdown:visible .ant-select-item-option', { hasText: 'Global variable' }).first().click(); await settle(900);
  await byId('workflow-reference-global-select').click(); await settle(1200);
  await snap('OC5_global-variable-picker', { x: 230, y: 90, width: 1160, height: 560 });
});

await step('paste-check', async () => {
  // Copy a step that reads another step, so its reference points outside the copy.
  await openEditor();
  await methodNode('cmdb-object-create').click({ button: 'right' }); await settle(900);
  await byId('workflow-context-menu-copy').click(); await settle(800);
  if (!WF_B) {
    // Create an empty target workflow on the docs instance.
    await go('/workflow/create', 5000);
    await page.keyboard.press('Control+s'); await settle(2500);
    const m = page.url().match(/update\/(\d+)/);
    if (m) WF_B = m[1];
  } else await openEditor(WF_B);
  await page.locator('[data-testid="rf__node-start-1"]').click({ button: 'right' }); await settle(900);
  await byId('workflow-context-menu-paste').click(); await settle(1800);
  const dlg = byId('workflow-node-paste-check-dialog');
  await dlg.waitFor();
  // Broken references open their tooltip for a few seconds; wait until it has gone.
  await parkPointer(); await settle(7000);
  await snap('OC5_paste-check-dialog', await boxOf(page.locator('.ant-modal:visible').last(), 0));
  await byId('workflow-paste-check-cancel').click();
});

console.log('\n' + log.join('\n'));
await browser.close();
