import { useEffect, useRef } from 'react';
import type { WorkflowHeaderMenuItem } from '../../types/workflow.types';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { WorkflowMenuItem } from './WorkflowMenuItem';

type Props = {
  open: boolean;
  items: WorkflowHeaderMenuItem[];
  onClose: () => void;
  onSelect?: (item: WorkflowHeaderMenuItem) => void;
  /** Id of the item whose async action is currently in flight; renders a spinner beside its label. */
  loadingItemId?: string | null;
};

export function HeaderMenu({ open, items, onClose, onSelect, loadingItemId }: Props) {
  const { t } = useI18n('workflow');
  const ref = useRef<HTMLDivElement | null>(null);
  const wasLoadingRef = useRef(false);

  useEffect(() => {
    const isLoading = loadingItemId != null;
    // Close the menu once a kept-open async action finishes (loading → idle).
    if (wasLoadingRef.current && !isLoading) onClose();
    wasLoadingRef.current = isLoading;
  }, [loadingItemId, onClose]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!ref.current) return;
      if (ref.current.contains(event.target as Node)) return;
      onClose();
    };

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('pointerdown', onPointerDown, true);
    window.addEventListener('keydown', onEscape);

    return () => {
      window.removeEventListener('pointerdown', onPointerDown, true);
      window.removeEventListener('keydown', onEscape);
    };
  }, [open, onClose]);

  if (!open) return null;

  const sections = items.reduce<Record<string, WorkflowHeaderMenuItem[]>>(
    (acc, item) => {
      const key = item.section ?? 'default';
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    },
    {},
  );

  return (
    <div ref={ref} className="headerMenu">
      {Object.entries(sections).map(([sectionKey, sectionItems]) => (
        <div key={sectionKey} className="headerMenuSection">
          {sectionItems.map((item) => {
            const isLoading = item.id === loadingItemId;
            return (
              <WorkflowMenuItem
                key={item.id}
                className="headerMenuItem"
                label={t(item.labelKey)}
                loading={isLoading}
                onClick={() => {
                  onSelect?.(item);
                  if (!item.keepOpenOnSelect) onClose();
                }}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
