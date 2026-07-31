/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useRef, useState } from 'react';
import { entityRegistry } from '@/engine/entity/EntityRegistry';
import { useWizardSubmit } from '@/engine/entity/runtime/genererics/useWizardSubmit';
import { useGetDataAggregatorsQuery } from '@entities/dataAggregator/api/dataAggregatorApi';
import type { DataAggregator } from '@entities/dataAggregator/model/types';

const ENTITY_NAME = 'data-aggregator';

type Args = {
  open: boolean;
  assignedId?: number | null;
};

export function useAggregatorConfigDialog({ open, assignedId }: Args) {
  const entity = entityRegistry.get(ENTITY_NAME);
  const { data: aggregators = [], isLoading: isLoadingAggregators } = useGetDataAggregatorsQuery();
  const [isCreating, setIsCreating] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const userTouchedRef = useRef(false);

  useEffect(() => {
    if (!open) return;
    setIsCreating(false);
    setSelectedId(null);
    userTouchedRef.current = false;
  }, [open]);

  useEffect(() => {
    if (!open || userTouchedRef.current || assignedId == null) return;
    setSelectedId(assignedId);
  }, [open, assignedId]);

  const selectedAggregator = useMemo(
    () => aggregators.find((aggregator) => aggregator.id === selectedId) ?? null,
    [aggregators, selectedId],
  );

  const updateInitialValues = useMemo(() => {
    if (!selectedAggregator || !entity.api) return undefined;
    return entity.api.mapToForm ? entity.api.mapToForm(selectedAggregator) : selectedAggregator;
  }, [entity, selectedAggregator]);

  const createSubmit = useWizardSubmit({ entityName: ENTITY_NAME, mode: 'create' });
  const updateSubmit = useWizardSubmit({
    entityName: ENTITY_NAME,
    mode: 'update',
    identifier: selectedAggregator ? String(selectedAggregator.id) : undefined,
  });

  const startCreate = () => {
    userTouchedRef.current = true;
    setIsCreating(true);
  };

  const selectExisting = (id: number) => {
    userTouchedRef.current = true;
    setIsCreating(false);
    setSelectedId(id);
  };

  const handleCreateSubmit = async (data: unknown) => {
    const created = (await createSubmit(data)) as DataAggregator;
    setIsCreating(false);
    setSelectedId(created.id);
  };

  const handleUpdateSubmit = async (data: unknown) => {
    await updateSubmit(data);
  };

  return {
    aggregators,
    isLoadingAggregators,
    isCreating,
    selectedId,
    selectedAggregator,
    updateInitialValues,
    startCreate,
    selectExisting,
    handleCreateSubmit,
    handleUpdateSubmit,
  };
}
