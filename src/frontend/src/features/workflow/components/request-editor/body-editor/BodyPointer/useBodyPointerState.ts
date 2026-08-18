import { useEffect, useMemo, useState, type MouseEvent } from 'react';
import { useConfirm } from '@shared/ui/confirm/ConfirmDialogContext';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { parseEnhancementArg } from '../../utils/parseEnhancementArg';
import type { BodyPointerProps } from './BodyPointer.types';

export function useBodyPointerState(props: BodyPointerProps) {
  const { pointer, pointers, onEdit, onRemove, connection, currentMethod } = props;
  const [hovered, setHovered] = useState(false);
  const [menuBelow, setMenuBelow] = useState(false);
  const [editorPos, setEditorPos] = useState<{ left: number; top: number } | null>(null);
  const confirm = useConfirm();
  const { t } = useI18n('workflow');
  const parsed = useMemo(() => parseEnhancementArg(pointer), [pointer]);
  const canEdit = Boolean(onEdit && connection && currentMethod);

  useEffect(() => {
    if (!editorPos) return;
    const onMouseDown = (event: globalThis.MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('.bodyPointerEditorPopup') || target?.closest('.ant-select-dropdown')) return;
      setEditorPos(null);
    };
    document.addEventListener('mousedown', onMouseDown, true);
    return () => document.removeEventListener('mousedown', onMouseDown, true);
  }, [editorPos]);

  const remove = async (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    const confirmed = await confirm({
      title: t('references.confirmDelete.title'),
      message: t('references.confirmDelete.message'),
    });
    if (confirmed) onRemove?.(pointer, pointers);
  };

  const openEditor = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    const margin = 16;
    const left = Math.min(Math.max(margin, rect.left), Math.max(margin, window.innerWidth - 576));
    const top = Math.min(rect.bottom + 8, Math.max(margin, window.innerHeight - 160));
    setEditorPos({ left, top });
  };

  const showMenu = (event: MouseEvent<HTMLDivElement>) => {
    const pointerRect = event.currentTarget.getBoundingClientRect();
    const containerTop = event.currentTarget.closest('.bodyLegacyJsonWrap')
      ?.getBoundingClientRect().top ?? 0;
    setMenuBelow(pointerRect.top - containerTop < (canEdit ? 76 : 44));
    setHovered(true);
  };

  return {
    color: parsed?.color || 'var(--color-text-disabled)',
    title: parsed ? `${parsed.messageProperty}.$${parsed.path ? `.${parsed.path}` : ''}` : pointer,
    canEdit, hovered, menuBelow, editorPos, setEditorPos, setHovered, remove, openEditor, showMenu,
  };
}
