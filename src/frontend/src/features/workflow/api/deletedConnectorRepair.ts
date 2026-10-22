import type { Connector } from "@entities/connector/model/types";
import { normalizeConnectionPayload } from "./connectionPayload";
import { getSavedUiNodes } from "./connectionMapper.savedUi";
import type { ConnectorMappingGroup } from "../components/template/templateConnectorMapping.utils";

import type { WorkflowNodeModel } from '../types/workflow.types';

type SavedConnector = NonNullable<WorkflowNodeModel['data']['connector']>;
type SavedMethod = {
  index?: string;
  id?: string;
  nodeId?: string;
  methodType?: string;
  connector?: SavedConnector | null;
  [key: string]: unknown;
};

const prepareConnection = (payload: unknown) => {
  const connection = normalizeConnectionPayload(payload);
  const savedNodes = getSavedUiNodes(connection.ui);
  connection.fromConnector.method = connection.fromConnector.method.map(
    (method: SavedMethod) => {
      if (method.methodType && method.methodType !== "CONNECTOR") return method;
      const saved = savedNodes.find(
        (node) =>
          String(node.index) === String(method.index) ||
          node.id === method.id ||
          (method.nodeId != null && node.nodeId === method.nodeId),
      );
      if (
        !saved?.data?.connector ||
        (method.connector && method.connector.connectorId !== -1)
      )
        return method;
      return { ...method, connector: { ...saved.data.connector } };
    },
  );
  return connection;
};

export function findDeletedConnectorGroups(
  payload: unknown,
  connectors: Connector[],
): ConnectorMappingGroup[] {
  const connection = prepareConnection(payload);
  const groups = new Map<number, ConnectorMappingGroup>();
  const existing = new Set(
    connectors.map((connector) => connector.connectorId),
  );
  for (const method of connection.fromConnector.method) {
    if (method.methodType && method.methodType !== "CONNECTOR") continue;
    const connector = method.connector;
    if (!connector || existing.has(connector.connectorId)) continue;
    const group: ConnectorMappingGroup = groups.get(connector.connectorId) ?? {
      oldConnectorId: connector.connectorId,
      templateTitle: connector.title,
      invokerName: connector.invokerName,
      methodNames: [],
    };
    if (!group.invokerName && connector.invokerName) group.invokerName = connector.invokerName;
    group.methodNames.push(method.label ?? method.name);
    groups.set(connector.connectorId, group);
  }
  return [...groups.values()];
}

export function repairDeletedConnectors(
  payload: unknown,
  mapping: Record<number, number>,
  connectors: Connector[],
) {
  const connection = prepareConnection(payload);
  const remapConnector = (connector?: SavedConnector | null) => {
    const targetId = connector ? mapping[connector.connectorId] : undefined;
    if (targetId == null) return connector;
    const target = connectors.find((item) => item.connectorId === targetId);
    if (!target) throw new Error("Replacement connector is unavailable");
    return {
      ...connector,
      connectorId: targetId,
      title: target.title,
      icon: typeof target.icon === "string" ? target.icon : null,
      invokerName: target.invoker?.name ?? null,
    };
  };
  return {
    ...connection,
    fromConnector: {
      ...connection.fromConnector,
      method: connection.fromConnector.method.map((method: SavedMethod) => method.methodType && method.methodType !== "CONNECTOR" ? method : ({
        ...method,
        connector: remapConnector(method.connector),
      })),
    },
    ui: connection.ui && {
      ...connection.ui,
      ...(Array.isArray(connection.ui.workflowNodes)
        ? {
            workflowNodes: connection.ui.workflowNodes.map((node: WorkflowNodeModel) => ({
              ...node,
              data: node.data && {
                ...node.data,
                ...(node.data.connector
                  ? { connector: remapConnector(node.data.connector) }
                  : {}),
              },
            })),
          }
        : {}),
    },
  };
}
