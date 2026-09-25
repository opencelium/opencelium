import { useEffect, useMemo, useRef } from 'react';
import type { WorkflowHeaderMenuItem } from '../../../types/workflow.types';
import type { HeaderMenuProps } from './HeaderMenu.types';

export function useHeaderMenu({ open, items, onClose, loadingItemId }: Pick<
  HeaderMenuProps, 'open' | 'items' | 'onClose' | 'loadingItemId'>) {
  const ref = useRef<HTMLDivElement | null>(null);
  const wasLoadingRef = useRef(false);

  useEffect(() => {
    const isLoading = loadingItemId != null;
    if (wasLoadingRef.current && !isLoading) onClose();
    wasLoadingRef.current = isLoading;
  }, [loadingItemId, onClose]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) onClose();
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

  const sections = useMemo(() => items.reduce<Record<string, WorkflowHeaderMenuItem[]>>(
    (result, item) => {
      (result[item.section ?? 'default'] ??= []).push(item);
      return result;
    }, {}), [items]);

  return { ref, sections };
}
