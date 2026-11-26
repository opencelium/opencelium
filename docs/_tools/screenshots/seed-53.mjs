/**
 * Seeds the demo data capture-53.mjs expects: five global variables (all three
 * kinds, one secret), five schedules with readable cron expressions, and a user
 * without an email address.
 *
 * ONLY run this against the docs copy of the database (see README.md) — never
 * against a production instance. Schedules are created disabled; on the docs
 * copy the Quartz scheduler is not started at all.
 *
 *   API=http://127.0.0.1:9190 OC_USER=admin@opencelium.io OC_PASS=1234 OC_WF=182 node seed-53.mjs
 */
import crypto from 'node:crypto';

const API = process.env.API || 'http://127.0.0.1:9190';
const WF = Number(process.env.OC_WF || 182);
const login = await fetch(`${API}/login`, { method: 'POST', headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ email: process.env.OC_USER || 'admin@opencelium.io', password: process.env.OC_PASS || '1234' }) });
const auth = login.headers.get('authorization');
if (!auth) throw new Error(`login failed: ${login.status}`);
const call = async (method, path, body) => {
  const r = await fetch(`${API}${path}`, { method, headers: { 'content-type': 'application/json', authorization: auth },
    body: body ? JSON.stringify(body) : undefined });
  console.log(method, path, r.status);
  return r;
};

const all = { type: 'ALL', categoryIds: [], workflowIds: [] };
await call('POST', '/global-variable', { name: 'idoitBaseUrl', kind: 'CONSTANT', description: 'Base URL of the i-doit JSON-RPC API',
  value: 'https://cmdb.example.com/src/jsonrpc.php', secret: false, scope: all });
await call('POST', '/global-variable', { name: 'defaultTenant', kind: 'CONSTANT', description: 'Tenant used when a record has none',
  value: { id: 3, name: 'Head office' }, secret: false, scope: all });
await call('POST', '/global-variable', { name: 'idoitApiKey', kind: 'CONSTANT', description: 'API key for i-doit',
  value: 'demo-not-a-real-key', secret: true, scope: all });
await call('POST', '/global-variable', { name: 'lastSyncAt', kind: 'MUTABLE', description: 'Time of the last successful sync',
  value: '2026-11-25T06:00:00Z', scope: { type: 'WORKFLOWS', categoryIds: [], workflowIds: [WF] }, busyPolicy: 'QUEUE', ownerWorkflowIds: [WF] });
await call('POST', '/global-variable', { name: 'formatDate', kind: 'SCRIPT', description: 'Formats an ISO date as dd.MM.yyyy',
  scope: all, script: { language: 'js',
    code: "var d = new Date(iso);\nfunction p(n) { return (n < 10 ? '0' : '') + n; }\nreturn p(d.getUTCDate()) + '.' + p(d.getUTCMonth() + 1) + '.' + d.getUTCFullYear();",
    parameters: [{ name: 'iso', description: 'ISO 8601 date', required: true }] } });

const sched = (title, cronExp) => call('POST', '/scheduler', { title, cronExp, status: false, debugMode: false, connectionId: WF });
await sched('Nightly CMDB sync', '0 0 2 * * ?');
await sched('Business hours delta', '0 0/30 8-17 ? * MON-FRI');
await sched('Morning report', '0 30 7 ? * MON-FRI');
await sched('Weekly cleanup', '0 0 22 ? * SUN');
await sched('Monthly audit', '0 0 6 1 * ?');

// A throwaway password: the account only exists so the password-link dialog has a user without email.
const pw = `Demo-${crypto.randomBytes(9).toString('base64url')}`;
await call('POST', '/user', { username: 'demo.operator', password: pw, userGroup: 1, userDetail: { name: 'Demo', surname: 'Operator' } });
