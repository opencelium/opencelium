/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react';
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
  const [mapping, setMapping] = useState<Record<number, number | undefined>>({});

  const suggestedConnectors = (group: ConnectorMappingGroup): Connector[] => {
    const invoker = findInvoker(invokers, group.invokerName);
    return invoker ? connectorsForInvoker(connectors, invoker) : [];
  };

  useEffect(() => {
    if (!open) return;
    setMapping(() => {
      const next: Record<number, number | undefined> = {};
      groups.forEach((group) => {
        // Only ever preselect from the suggested set — an old connectorId that happens to
        // collide with a real one here but doesn't match the invoker is a coincidence, not a
        // signal, so an empty suggestion list means no preselection at all.
        const suggested = suggestedConnectors(group);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, groups, connectors, invokers]);

  const selectConnector = (oldConnectorId: number, connectorId: number) => {
    setMapping((prev) => ({ ...prev, [oldConnectorId]: connectorId }));
  };

  const createSubmit = useWizardSubmit({ entityName: 'connector', mode: 'create' });

  const createConnectorForGroup = async (oldConnectorId: number, data: unknown) => {
    const created = (await createSubmit(data)) as Connector;
    selectConnector(oldConnectorId, created.connectorId);
    return created;
  };

  const isComplete = groups.length > 0 && groups.every((group) => mapping[group.oldConnectorId] != null);

  return {
    mapping,
    selectConnector,
    suggestedConnectors,
    createConnectorForGroup,
    isComplete,
  };
}
