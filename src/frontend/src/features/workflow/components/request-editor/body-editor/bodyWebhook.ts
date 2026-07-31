export type WebhookType = 'string' | 'int' | 'double' | 'boolean' | 'array' | 'object';

export type WebhookOption = {
  label: string;
  name: string;
  type: WebhookType;
  value: string;
};

export const WEBHOOK_TYPES: WebhookType[] = ['string', 'int', 'double', 'boolean', 'array', 'object'];

const createdWebhooks = new Map<string, WebhookOption>();

const buildLabel = (name: string, type: WebhookType) => {
  if (type === 'array') return `${name} (Array)`;
  if (type === 'object') return `${name} (Object)`;
  return name;
};

export const createWebhookOption = (name: string, type: WebhookType): WebhookOption => ({
  name,
  type,
  value: `${name}:${type}`,
  label: buildLabel(name, type),
});

export const getWebhookOptions = () =>
  Array.from(createdWebhooks.values()).sort((left, right) => left.label.localeCompare(right.label));

export const upsertWebhookOption = (name: string, type: WebhookType) => {
  const option = createWebhookOption(name, type);
  createdWebhooks.set(option.value, option);
  return option;
};

export const webhookSnippet = (webhook: string) => `\${${webhook}}`;

export const extractWebhookValue = (snippet: string) =>
  snippet.startsWith('${') && snippet.endsWith('}') ? snippet.slice(2, -1) : snippet;

export const parseWebhookValue = (value: string) => {
  const [name, rawType] = String(value || '').split(':');
  const type = (rawType || 'string') as WebhookType;
  return createWebhookOption(name || value, type);
};
