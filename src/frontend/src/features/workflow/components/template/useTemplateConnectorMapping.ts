/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useState } from 'react';
import type { Connector } from '@entities/connector/model/types';
import type { Invoker } from '@entities/invoker/model/types';
import { useWizardSubmit } from '@/engine/entity/runtime/genererics/useWizardSubmit';
import type { ConnectorMappingGroup } from './templateConnectorMapping.utils';

type Args = {
  open: boolean;
  groups: ConnectorMappingGroup[];
  connectors: Connector[];
  invokers: Invoker[];
};

const findInvoker = (invokers: Invoker[], invokerName: string | null) =>
  invokerName ? invokers.find((invoker) => invoker.name.toLowerCase() === invokerName.toLowerCase()) : undefined;

const connectorsForInvoker = (connectors: Connector[], invoker: Invoker) =>
  connectors.filter((connector) => connector.invoker?.name?.toLowerCase() === invoker.name.toLowerCase());

export function useTemplateConnectorMapping({ open, groups, connectors, invokers }: Args) {
  const [createdConnectors, setCreatedConnectors] = useState<Connector[]>([]);
  const [mapping, setMapping] = useState<Record<number, number | undefined>>({});

  const suggestedConnectors = useCallback((group: ConnectorMappingGroup): Connector[] => {
    const available = [...connectors, ...createdConnectors.filter((created) => !connectors.some((connector) => connector.connectorId === created.connectorId))];
    const invoker = findInvoker(invokers, group.invokerName);
    return invoker ? connectorsForInvoker(available, invoker) : available.filter((connector) => !group.invokerName || connector.invoker?.name?.toLowerCase() === group.invokerName.toLowerCase());
  }, [connectors, createdConnectors, invokers]);

  useEffect(() => {
    if (!open) {
      setMapping({});
      if (createdConnectors.length) setCreatedConnectors([]);
      return;
    }
    setMapping((previous) => {
      const next: Record<number, number | undefined> = {};
      groups.forEach((group) => {
        const suggested = suggestedConnectors(group);
        if (suggested.some((connector) => connector.connectorId === previous[group.oldConnectorId])) {
          next[group.oldConnectorId] = previous[group.oldConnectorId];
          return;
        }
        if (suggested.length === 0) {
          next[group.oldConnectorId] = undefined;
          return;
        }
        const sameId = suggested.find((connector) => connector.connectorId === group.oldConnectorId);
        next[group.oldConnectorId] = sameId
          ? sameId.connectorId
          : suggested.length === 1
            ? suggested[0].connectorId
            : undefined;
      });
      return next;
    });
  }, [open, groups, suggestedConnectors, createdConnectors]);

  const selectConnector = (oldConnectorId: number, connectorId: number) => {
    setMapping((prev) => ({ ...prev, [oldConnectorId]: connectorId }));
  };

  const createSubmit = useWizardSubmit({ entityName: 'connector', mode: 'create' });

  const createConnectorForGroup = async (oldConnectorId: number, data: unknown) => {
    const created = (await createSubmit(data)) as Connector;
    setCreatedConnectors((previous) => [...previous, created]);
    selectConnector(oldConnectorId, created.connectorId);
    return created;
  };

  const isComplete = groups.length > 0 && groups.every((group) => suggestedConnectors(group).some((connector) => connector.connectorId === mapping[group.oldConnectorId]));

  return {
    createdConnectors,
    mapping,
    selectConnector,
    suggestedConnectors,
    createConnectorForGroup,
    isComplete,
  };
}
