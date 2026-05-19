import { useEffect, useRef } from 'react';
import type { WorkflowHeaderMenuItem } from '../../types/workflow.types';

type Props = {
  open: boolean;
  items: WorkflowHeaderMenuItem[];
  onClose: () => void;
  onSelect?: (item: WorkflowHeaderMenuItem) => void;
};

export function HeaderMenu({ open, items, onClose, onSelect }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);

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
          {sectionItems.map((item) => (
            <button
              key={item.id}
              className="headerMenuItem"
              type="button"
              onClick={() => {
                onSelect?.(item);
                onClose();
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
