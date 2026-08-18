import type { Connection, MethodWithId } from '../../types/connection';
import { MethodType } from '../../types/connection';
import type { WorkflowNodeModel } from '../../types/workflow.types';
import { ALL_COLORS } from '../../constants/colors';
import { ensureMethodConfig } from '../../utils/requestConfig';
import { collectLegacyFieldBindings } from './legacyFieldBindings';
import {
  buildLegacyMethodResponse,
  buildLegacyPayload,
  deserializeMethodConfigReferences,
} from './legacyMethodConfig';

const resolveMethodColor = (
  node: WorkflowNodeModel,
  index: number,
  usedColors: Set<string>,
) => {
  const explicitColor = typeof node.data.color === 'string' ? node.data.color.trim() : '';
  if (explicitColor) return explicitColor;
  const color = ALL_COLORS.find((candidate) => !usedColors.has(candidate.toLowerCase()))
    ?? ALL_COLORS[index % ALL_COLORS.length];
  usedColors.add(color.toLowerCase());
  return color;
};

const buildLegacyMethod = (
  node: WorkflowNodeModel,
  index: number,
  usedColors: Set<string>,
): MethodWithId => {
  const config = deserializeMethodConfigReferences(ensureMethodConfig(node.data.methodConfig));
  const name = node.data.subtitle || node.data.title || node.id;
  const color = resolveMethodColor(node, index, usedColors);
  const isHttpRequest = node.type === 'system' || node.type === 'trigger-connection';
  const methodType = node.type === 'system'
    ? MethodType.HttpRequest
    : node.type === 'trigger-connection' ? MethodType.Webhook : MethodType.Connector;

  return {
    id: node.id,
    index: String(index),
    name,
    color,
    ...(node.data.jumpTo ? { jumpTo: node.data.jumpTo } : {}),
    label: name,
    methodType,
    connector: !isHttpRequest && node.data.connector ? {
      connectorId: node.data.connector.connectorId,
      title: node.data.connector.title,
      icon: node.data.connector.icon ?? null,
    } : null,
    request: {
      requestId: `request-${node.id}`,
      endpoint: config.url,
      method: config.method || 'GET',
      header: config.headers,
      body: {
        ...buildLegacyPayload(config.body, config.bodyData as any),
        format: config.bodyFormat as any,
      },
      queryParams: config.queryParams,
      endpointArgs: config.endpointArgs as any,
    },
    response: {
      responseId: `response-${node.id}`,
      success: buildLegacyMethodResponse(node, config, 'success'),
      fail: buildLegacyMethodResponse(node, config, 'fail'),
    },
  } as MethodWithId;
};

export const buildLegacyConnection = (nodes: WorkflowNodeModel[]): Connection => {
  const methodNodes = nodes.filter((node) =>
    node.type === 'connector' || node.type === 'system' || node.type === 'trigger-connection');
  const usedColors = new Set<string>();
  methodNodes.forEach((node) => {
    const color = typeof node.data.color === 'string' ? node.data.color.trim() : '';
    if (color) usedColors.add(color.toLowerCase());
  });
  const methods = methodNodes.map((node, index) => buildLegacyMethod(node, index, usedColors));

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
    fieldBindings: collectLegacyFieldBindings(methods),
    ui: { flowcharts: [], flowchartEdges: [], operators: [] },
  };
};
