import type { Connection, MethodResponse, PayloadData } from '../../types/connection';
import type { WorkflowMethodConfig } from '../../types/request-config.types';
import type { WorkflowNodeModel } from '../../types/workflow.types';
import {
  buildQueryParamsFromEndpoint,
  deserializeBackendReferenceTokens,
  unwrapBackendReferences,
} from './url-editor/urlEditor.utils';

export const buildLegacyPayload = (
  fields: any,
  data: PayloadData['data'] = 'raw',
): PayloadData => ({
  type: 'object' as any,
  format: 'json' as any,
  data,
  fields,
});

export const buildLegacyMethodResponse = (
  node: WorkflowNodeModel,
  config: WorkflowMethodConfig,
  type: 'success' | 'fail',
): MethodResponse => {
  const response = (node.data as any).response?.[type] ?? config.response?.[type];
  if (response) return response;
  const emptyBody = buildLegacyPayload({});

  if (node.type === 'system' || node.type === 'trigger-connection') {
    return type === 'success'
      ? { status: '200', header: {}, body: emptyBody }
      : { status: '500', header: {}, body: emptyBody };
  }

  return type === 'success'
    ? {
      status: '200',
      header: config.headers,
      body: {
        ...buildLegacyPayload(config.body),
        format: config.bodyFormat as any,
      },
    }
    : { status: '500', header: {}, body: buildLegacyPayload({}) };
};

export const deserializeMethodConfigReferences = (
  config: WorkflowMethodConfig,
): WorkflowMethodConfig => {
  const endpointArgs = { ...(config.endpointArgs as any) };
  const url = deserializeBackendReferenceTokens(config.url || '', endpointArgs);
  let nextEndpointArgs = url.endpointArgs;
  const queryParams = (config.queryParams || []).map((param) => {
    const value = deserializeBackendReferenceTokens(param.value || '', nextEndpointArgs);
    nextEndpointArgs = value.endpointArgs;
    return { ...param, value: value.value };
  });

  return {
    ...config,
    url: url.value,
    headers: unwrapBackendReferences(config.headers) as WorkflowMethodConfig['headers'],
    queryParams,
    endpointArgs: nextEndpointArgs,
    body: unwrapBackendReferences(config.body),
  };
};

export const extractWorkflowMethodConfig = (
  connection: Connection | null,
  nodeId: string,
): WorkflowMethodConfig | null => {
  const method = connection?.fromConnector.method.find((item) => item.id === nodeId);
  if (!method) return null;
  const queryParams = buildQueryParamsFromEndpoint(
    method.request.endpoint || '',
    method.request.queryParams || [],
  );
  return deserializeMethodConfigReferences({
    url: method.request.endpoint,
    method: method.request.method || 'GET',
    headers: method.request.header || {},
    queryParams,
    endpointArgs: (method.request.endpointArgs || {}) as any,
    bodyFormat: (method.request.body?.format as WorkflowMethodConfig['bodyFormat']) || 'json',
    bodyData: (method.request.body?.data as WorkflowMethodConfig['bodyData']) || 'raw',
    body: method.request.body?.fields ?? {},
    response: method.response,
  });
};
