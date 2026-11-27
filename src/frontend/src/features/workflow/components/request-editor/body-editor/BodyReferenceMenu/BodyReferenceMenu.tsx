import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { useEffect, useState, type MouseEvent, type ReactNode } from 'react';
import { useConfirm } from '@shared/ui/confirm/ConfirmDialogContext';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { useTestRun } from '../../../../test-run/useTestRun';
import type { Connection, MethodWithId } from '../../../../types/connection';
import { BodyPointerEditorPopup } from '../BodyPointer/BodyPointerEditorPopup';
import '../BodyPointer/BodyPointer.css';
import { isInEditorPopupLayer } from '../../editorPopupLayers';

type Props = {
  /** The reference as written in the field — what the editor opens on. */
  value: string;
  children: ReactNode;
  /** A muted first row with details about the reference. */
  title?: string;
  onEdit?: (reference: string) => void;
  onRemove?: () => void;
  connection?: Connection;
  currentMethod?: MethodWithId;
};

const EDITOR_WIDTH = 560;
const MARGIN = 16;

// The method reference's hover menu (BodyPointer) for the chips that aren't a colour swatch:
// webhooks and global variables. Same look, same confirm, same editor popup.
export function BodyReferenceMenu({ value, children, title, onEdit, onRemove, connection, currentMethod }: Props) {
  const [isHovered, setHovered] = useState(false);
  const [isMenuBelow, setMenuBelow] = useState(false);
  const [editorPos, setEditorPos] = useState<{ left: number; top: number } | null>(null);
  const confirm = useConfirm();
  const { t } = useI18n('workflow');
  const isPaused = useTestRun()?.isPaused ?? false;
  const canEdit = !!onEdit && !!connection && !!currentMethod;

  useEffect(() => {
    if (!editorPos) return;
    const onMouseDown = (event: globalThis.MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('.bodyPointerEditorPopup') || isInEditorPopupLayer(target)) return;
      setEditorPos(null);
    };
    document.addEventListener('mousedown', onMouseDown, true);
    return () => document.removeEventListener('mousedown', onMouseDown, true);
  }, [editorPos]);

  const showMenu = (event: MouseEvent<HTMLSpanElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const containerTop = event.currentTarget.closest('.bodyLegacyJsonWrap')?.getBoundingClientRect().top ?? 0;
    setMenuBelow(rect.top - containerTop < (canEdit ? 76 : 44) + (title ? 28 : 0));
    setHovered(true);
  };
  const openEditor = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    setEditorPos({
      left: Math.min(Math.max(MARGIN, rect.left), Math.max(MARGIN, window.innerWidth - EDITOR_WIDTH - MARGIN)),
      top: Math.min(rect.bottom + 8, Math.max(MARGIN, window.innerHeight - 160)),
    });
  };
  const remove = async (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    const isConfirmed = await confirm({
      title: t('references.confirmDelete.title'),
      message: t('references.confirmDelete.message'),
    });
    if (isConfirmed) onRemove?.();
  };

  return (
    <span className='bodyReferenceMenuHost' onMouseEnter={showMenu} onMouseLeave={() => setHovered(false)}>
      {children}
      {isHovered && !isPaused && (canEdit || onRemove) ? (
        <span className={`bodyPointerMenu ${isMenuBelow ? 'bodyPointerMenu--below' : ''}`}>
          <span className='bodyPointerMenuList'>
            {title && <span className='bodyPointerMenuTitle' title={title}>{title}</span>}
            {canEdit && (
              <button type='button' className='bodyPointerMenuItem' onClick={openEditor}>
                <EditOutlined style={{ fontSize: 12 }} />
                {t('actions.edit')}
              </button>
            )}
            {onRemove && (
              <button type='button' className='bodyPointerMenuItem bodyPointerMenuItem--danger' onClick={remove}>
                <DeleteOutlined style={{ fontSize: 12 }} />
                {t('actions.delete')}
              </button>
            )}
          </span>
        </span>
      ) : null}
      <BodyPointerEditorPopup connection={connection} currentMethod={currentMethod} position={editorPos} value={value}
        onApply={(reference) => {
          onEdit?.(reference);
          setEditorPos(null);
        }} />
    </span>
  );
}
