import type { Connector } from '@entities/connector/model/types';
import type { WorkflowNodeModel } from '../../types/workflow.types';

export type ConnectorMappingGroup = {
  oldConnectorId: number;
  templateTitle: string;
  invokerName: string | null;
  methodNames: string[];
};

const CONNECTOR_NODE_TYPES = new Set(['connector', 'system']);

const isConnectorNode = (node: WorkflowNodeModel) => CONNECTOR_NODE_TYPES.has(node.type ?? '');

export function extractConnectorGroups(nodes: WorkflowNodeModel[]): ConnectorMappingGroup[] {
  const groups = new Map<number, ConnectorMappingGroup>();

  nodes.forEach((node) => {
    if (!isConnectorNode(node)) return;
    const connector = node.data.connector;
    if (!connector) return;

    const methodName = node.data.subtitle ?? node.data.title;
    const existing = groups.get(connector.connectorId);
    if (existing) {
      existing.methodNames.push(methodName);
      if (!existing.invokerName && connector.invokerName) existing.invokerName = connector.invokerName;
      return;
    }

    groups.set(connector.connectorId, {
      oldConnectorId: connector.connectorId,
      templateTitle: connector.title,
      invokerName: connector.invokerName ?? null,
      methodNames: [methodName],
    });
  });

  return Array.from(groups.values());
}

export function applyConnectorMapping(
  nodes: WorkflowNodeModel[],
  mapping: Record<number, number>,
  connectors: Connector[],
): WorkflowNodeModel[] {
  return nodes.map((node) => {
    if (!isConnectorNode(node)) return node;
    const connector = node.data.connector;
    if (!connector) return node;

    const targetConnectorId = mapping[connector.connectorId];
    if (targetConnectorId == null) return node;

    const targetConnector = connectors.find((item) => item.connectorId === targetConnectorId);
    if (!targetConnector) return node;

    return {
      ...node,
      data: {
        ...node.data,
        connector: {
          ...connector,
          connectorId: targetConnector.connectorId,
          title: targetConnector.title,
          icon: typeof targetConnector.icon === 'string' ? targetConnector.icon : null,
          invokerName: targetConnector.invoker?.name ?? null,
          status: targetConnector.status,
          lastTestError: targetConnector.lastTestError ?? null,
          lastCheckedAt: targetConnector.lastCheckedAt ?? null,
        },
      },
    } as WorkflowNodeModel;
  });
}
