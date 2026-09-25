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
  url: 'https://your-domain.com',
  method: 'GET',
  headers: {},
  queryParams: [createTemplateRow()],
  endpointArgs: {},
  bodyFormat: 'json',
  bodyData: 'raw',
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
    bodyData: request.body?.data || 'raw',
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
  bodyData: config?.bodyData ?? 'raw',
  body: config?.body ?? {},
  response: config?.response,
});

/**
 * Strips the parts of a method config the user never authored, so merely opening
 * and closing a request dialog is not mistaken for an edit. Closing always
 * writes the config back through the legacy adapter round-trip
 * (useMethodConfigDialogState.persistCurrentConfig), and that round-trip:
 *
 * - fills in `response` from the invoker's operation, or synthesises one
 *   outright (buildLegacyMethodResponse) when the node has none;
 * - rebuilds `queryParams` from the URL string, minting a fresh `id` per row and
 *   appending the editor's trailing blank template row.
 *
 * None of that is a user decision, so none of it belongs in the undo identity.
 * Snapshots still store the whole node, so undo restores these fields intact —
 * this only governs whether a state counts as a new edit.
 */
export const toAuthoredMethodConfig = (methodConfig: WorkflowMethodConfig | undefined) => {
  if (!methodConfig) return methodConfig;
  const authored: Partial<WorkflowMethodConfig> = { ...methodConfig };
  delete authored.response;
  return {
    ...authored,
    queryParams: (methodConfig.queryParams ?? [])
      .filter((param) => param.enabled || String(param.key ?? '').trim() !== ''
        || String(param.value ?? '').trim() !== '')
      .map((param) => {
        const row: Partial<WorkflowQueryParam> = { ...param };
        delete row.id;
        return row;
      }),
  };
};
