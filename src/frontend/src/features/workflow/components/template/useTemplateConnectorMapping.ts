/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react';
import type { Connector } from '@entities/connector/model/types';
import { useWizardSubmit } from '@/engine/entity/runtime/genererics/useWizardSubmit';
import type { ConnectorMappingGroup } from './templateConnectorMapping.utils';

type Args = {
  open: boolean;
  groups: ConnectorMappingGroup[];
  connectors: Connector[];
};

const matchesInvoker = (connector: Connector, invokerName: string) =>
  connector.invoker?.name?.toLowerCase() === invokerName.toLowerCase();

export function useTemplateConnectorMapping({ open, groups, connectors }: Args) {
  const [mapping, setMapping] = useState<Record<number, number | undefined>>({});
  const [creatingForId, setCreatingForId] = useState<number | null>(null);

  useEffect(() => {
    if (!open) return;
    setCreatingForId(null);
    setMapping(() => {
      const next: Record<number, number | undefined> = {};
      groups.forEach((group) => {
        const sameId = connectors.find((connector) => connector.connectorId === group.oldConnectorId);
        if (sameId) {
          next[group.oldConnectorId] = sameId.connectorId;
          return;
        }
        const suggested = group.invokerName
          ? connectors.filter((connector) => matchesInvoker(connector, group.invokerName!))
          : [];
        next[group.oldConnectorId] = suggested.length === 1 ? suggested[0].connectorId : undefined;
      });
      return next;
    });
  }, [open, groups, connectors]);

  const selectConnector = (oldConnectorId: number, connectorId: number) => {
    setMapping((prev) => ({ ...prev, [oldConnectorId]: connectorId }));
  };

  const groupedConnectors = (group: ConnectorMappingGroup): { suggested: Connector[]; rest: Connector[] } => {
    if (!group.invokerName) return { suggested: [], rest: connectors };
    const suggested = connectors.filter((connector) => matchesInvoker(connector, group.invokerName!));
    const suggestedIds = new Set(suggested.map((connector) => connector.connectorId));
    return { suggested, rest: connectors.filter((connector) => !suggestedIds.has(connector.connectorId)) };
  };

  const createSubmit = useWizardSubmit({ entityName: 'connector', mode: 'create' });

  const startCreate = (oldConnectorId: number) => setCreatingForId(oldConnectorId);
  const cancelCreate = () => setCreatingForId(null);

  const handleCreateSubmit = async (data: unknown) => {
    const created = (await createSubmit(data)) as Connector;
    if (creatingForId != null) selectConnector(creatingForId, created.connectorId);
    setCreatingForId(null);
  };

  const isComplete = groups.length > 0 && groups.every((group) => mapping[group.oldConnectorId] != null);

  return {
    mapping,
    creatingForId,
    selectConnector,
    groupedConnectors,
    startCreate,
    cancelCreate,
    handleCreateSubmit,
    isComplete,
  };
}
