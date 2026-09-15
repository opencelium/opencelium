/**
 * Where the AI routes live.
 *
 * Empty by default, so `/ai/...` resolves against the configured API base like every other
 * request — which is what it will do once the backend serves these routes. Setting
 * VITE_AI_PROXY_URL to the dev server's own origin sends them to the Vite dev bridge
 * instead (see vite/aiProxy.ts), which is the only way to reach a real model without a key
 * in the browser. Pair it with VITE_ENABLE_AI_MOCK=false or MSW answers first.
 */
const AI_BASE = (import.meta.env.VITE_AI_PROXY_URL as string | undefined) ?? '';

export const aiUrl = (path: `/${string}`) => `${AI_BASE}${path}`;
