import type { WorkflowMethodConfig, WorkflowQueryParam } from '../types/request-config.types';
import type { InvokerOperation } from '@entities/invoker/model/types';
import { buildQueryParamsFromEndpoint } from '../components/request-editor/url-editor/urlEditor.utils';
import { createShortId } from '@shared/lib/createId';

const createId = (prefix: string) => createShortId(prefix);

const createTemplateRow = (): WorkflowQueryParam => ({
  id: createId('query'),
  key: '',
  value: '',
  enabled: false,
});

export const createEmptyMethodConfig = (): WorkflowMethodConfig => ({
  url: '{url}/unit',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  queryParams: [createTemplateRow()],
  endpointArgs: {},
  bodyFormat: 'json',
  body: {},
});

export const createMethodConfigFromOperation = (operation?: InvokerOperation): WorkflowMethodConfig => {
  if (!operation) return createEmptyMethodConfig();
  const request = operation.request || {};
  const fallback = createEmptyMethodConfig();
  return {
    name: operation.name,
    url: request.endpoint || fallback.url,
    method: request.method || 'GET',
    headers: request.header || {},
    queryParams: buildQueryParamsFromEndpoint(request.endpoint || fallback.url),
    endpointArgs: {},
    bodyFormat: request.body?.format || 'json',
    body: request.body?.fields ?? {},
    response: {
      responseId: `response-${operation.name}`,
      success: operation.response.success,
      fail: operation.response.fail,
    },
  };
};

export const createMethodConfigFromWebhookUrl = (url: string): WorkflowMethodConfig => ({
  ...createEmptyMethodConfig(),
  url,
  queryParams: buildQueryParamsFromEndpoint(url),
});

export const ensureMethodConfig = (config?: Partial<WorkflowMethodConfig>): WorkflowMethodConfig => ({
  name: config?.name,
  url: config?.url ?? createEmptyMethodConfig().url,
  method: config?.method ?? 'GET',
  headers: config?.headers ?? createEmptyMethodConfig().headers,
  queryParams: config?.queryParams?.length ? config.queryParams : createEmptyMethodConfig().queryParams,
  endpointArgs: config?.endpointArgs ?? {},
  bodyFormat: config?.bodyFormat ?? 'json',
  body: config?.body ?? {},
  response: config?.response,
});
