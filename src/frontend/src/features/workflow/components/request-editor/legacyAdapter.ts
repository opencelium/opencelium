import type { Connection, Enhancement, FieldBinding, MethodResponse, MethodWithId, PayloadData } from '../../types/connection';
import {
  buildQueryParamsFromEndpoint,
  deserializeBackendReferenceTokens,
  unwrapBackendReferences,
} from './url-editor/urlEditor.utils';
import { collectEnhancementsFromObject } from './body-editor/bodyBinding';
import type { WorkflowMethodConfig } from '../../types/request-config.types';
import type { WorkflowNodeModel } from '../../types/workflow.types';
import { ensureMethodConfig } from '../../utils/requestConfig';
import { ALL_COLORS } from '../../constants/colors';

const buildPayload = (fields: any): PayloadData => ({
  type: 'object' as any,
  format: 'json' as any,
  data: 'raw' as any,
  fields,
});

const buildMethodResponse = (
  node: WorkflowNodeModel,
  config: WorkflowMethodConfig,
  type: 'success' | 'fail',
): MethodResponse => {
  const response = (node.data as any).response?.[type] ?? config.response?.[type];
  if (response) return response;
  const emptyBody = buildPayload({});

  if (node.type === 'system') {
    return type === 'success'
      ? {
        status: '200',
        header: {},
        body: emptyBody,
      }
      : {
        status: '500',
        header: {},
        body: emptyBody,
      };
  }

  return type === 'success'
    ? {
      status: '200',
      header: config.headers,
      body: {
        ...buildPayload(config.body),
        format: config.bodyFormat as any,
      },
    }
    : {
      status: '500',
      header: {},
      body: buildPayload({}),
    };
};

const deserializeMethodConfigReferences = (config: WorkflowMethodConfig): WorkflowMethodConfig => {
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

const collectFieldBindings = (methods: MethodWithId[]): FieldBinding[] => {
  const seen = new Map<string, Enhancement>();
  methods.forEach((method) => {
    collectEnhancementsFromObject(method.request.body?.fields || {}, method.color, 'body').forEach((enhancement) => {
      seen.set(enhancement.enhanceId, enhancement);
    });
    collectEnhancementsFromObject(method.request.header || {}, method.color, 'header').forEach((enhancement) => {
      seen.set(enhancement.enhanceId, enhancement);
    });
  });
  return Array.from(seen.values()).map((enhancement) => ({ enhancement }));
};

export const buildLegacyConnection = (nodes: WorkflowNodeModel[]): Connection => {
  const methods: MethodWithId[] = nodes
    .filter((node) => node.type === 'connector' || node.type === 'system')
    .map((node, index) => {
      const config = deserializeMethodConfigReferences(ensureMethodConfig(node.data.methodConfig));
      const name = node.data.subtitle || node.data.title || node.id;
      const color = ALL_COLORS[index % ALL_COLORS.length];
      const isHttpRequest = node.type === 'system';
      return {
        id: node.id,
        index: String(index),
        name,
        color,
        label: name,
        connector: !isHttpRequest && node.data.connector
          ? {
            connectorId: node.data.connector.connectorId,
            title: node.data.connector.title,
            icon: node.data.connector.icon ?? null,
          }
          : null,
        request: {
          requestId: `request-${node.id}`,
          endpoint: config.url,
          method: config.method || 'GET',
          header: config.headers,
          body: {
            ...buildPayload(config.body),
            format: config.bodyFormat as any,
          },
          queryParams: config.queryParams,
          endpointArgs: config.endpointArgs as any,
        },
        response: {
          responseId: `response-${node.id}`,
          success: buildMethodResponse(node, config, 'success'),
          fail: buildMethodResponse(node, config, 'fail'),
        },
      } as MethodWithId;
    });

  return {
    connectionId: 1,
    name: 'Workflow Connection',
    description: '',
    fromConnector: {
      connectorId: -1,
      title: 'DEFAULT',
      operator: [],
      method: methods,
    },
    toConnector: null,
    fieldBindings: collectFieldBindings(methods),
    ui: {
      flowcharts: [],
      flowchartEdges: [],
      operators: [],
    },
  };
};

export const extractWorkflowMethodConfig = (connection: Connection | null, nodeId: string): WorkflowMethodConfig | null => {
  const method = connection?.fromConnector.method.find((item) => item.id === nodeId);
  if (!method) return null;
  const queryParams = buildQueryParamsFromEndpoint(method.request.endpoint || '', method.request.queryParams || []);
  return deserializeMethodConfigReferences({
    url: method.request.endpoint,
    method: method.request.method || 'GET',
    headers: method.request.header || {},
    queryParams,
    endpointArgs: (method.request.endpointArgs || {}) as any,
    bodyFormat: (method.request.body?.format as WorkflowMethodConfig['bodyFormat']) || 'json',
    body: method.request.body?.fields ?? {},
    response: method.response,
  });
};
