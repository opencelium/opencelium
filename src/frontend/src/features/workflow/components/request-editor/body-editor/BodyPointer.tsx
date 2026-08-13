import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import type { MouseEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useConfirm } from '@shared/ui/confirm/ConfirmDialogContext';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { parseEnhancementArg } from '../utils/parseEnhancementArg';
import { formatLiveReferenceValue, useLiveReferenceValue } from '../utils/useLiveReferenceValue';
import type { Connection, MethodWithId } from '../../../types/connection';
import { LegacyBodyReferenceGenerator } from './LegacyBodyReferenceGenerator';
import './BodyPointer.css';

type Props = {
  pointer: string;
  pointers: string[];
  submitEdit?: () => void;
  onClick?: (event?: unknown) => void;
  onRemove?: (pointer: string, pointers: string[]) => void;
  onEdit?: (pointer: string, pointers: string[], reference: string) => void;
  connection?: Connection;
  currentMethod?: MethodWithId;
};

export function BodyPointer({ pointer, pointers, onClick, onRemove, onEdit, connection, currentMethod }: Props) {
  const [hovered, setHovered] = useState(false);
  const [editorPos, setEditorPos] = useState<{ left: number; top: number } | null>(null);
  const confirm = useConfirm();
  const { t: tWorkflow } = useI18n('workflow');
  const parsed = useMemo(() => parseEnhancementArg(pointer), [pointer]);
  const color = parsed?.color || 'var(--color-text-disabled)';
  const staticTitle = parsed
    ? parsed.path
      ? `${parsed.messageProperty}.$.${parsed.path}`
      : `${parsed.messageProperty}.$`
    : pointer;
  const canEdit = !!onEdit && !!connection && !!currentMethod;

  // While paused and the referenced method has already run this test, show
  // what it actually resolved to instead of just the structural path — see
  // useLiveReferenceValue.ts. A field with exactly one reference replaces the
  // whole chip with the value text; a field with more keeps the chip (can't
  // tell which reference an ambiguous multi-reference field's shown value
  // would even belong to) and folds the value into the hover tooltip instead.
  const { value: liveValue, hasValue: hasLiveValue } = useLiveReferenceValue(parsed, connection, currentMethod);
  const liveValueText = hasLiveValue ? formatLiveReferenceValue(liveValue) : null;
  const isOnlyReferenceInField = pointers.length <= 1;
  const showInlineValue = isOnlyReferenceInField && liveValueText !== null;
  const title = liveValueText !== null ? `${staticTitle} = ${liveValueText}` : staticTitle;

  useEffect(() => {
    if (!editorPos) return;
    const onMouseDown = (event: globalThis.MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (target.closest('.bodyPointerEditorPopup') || target.closest('.ant-select-dropdown')) return;
      setEditorPos(null);
    };
    document.addEventListener('mousedown', onMouseDown, true);
    return () => document.removeEventListener('mousedown', onMouseDown, true);
  }, [editorPos]);

  const remove = async (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    const ok = await confirm({
      title: tWorkflow('references.confirmDelete.title'),
      message: tWorkflow('references.confirmDelete.message'),
    });
    if (!ok) return;
    onRemove?.(pointer, pointers);
  };

  const openEditor = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    const width = 560;
    const margin = 16;
    const left = Math.min(Math.max(margin, rect.left), Math.max(margin, window.innerWidth - width - margin));
    const top = Math.min(rect.bottom + 8, Math.max(margin, window.innerHeight - 160));
    setEditorPos({ left, top });
  };

  return (
    <div
      title={title}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={
        showInlineValue
          ? {
              position: 'relative',
              display: 'inline-block',
              float: 'left',
              margin: '2px 2px',
              padding: '1px 5px',
              maxWidth: 240,
              borderRadius: 3,
              background: color,
              color: '#fff',
              fontSize: 11,
              lineHeight: '14px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
            }
          : {
              position: 'relative',
              float: 'left',
              margin: '7px 2px',
              width: 20,
              height: 10,
              background: color,
              cursor: 'pointer',
            }
      }
    >
      {showInlineValue ? liveValueText : null}
      {hovered ? (
        <div className='bodyPointerMenu'>
          <div className='bodyPointerMenuList'>
            {canEdit && (
              <button type='button' className='bodyPointerMenuItem' onClick={openEditor}>
                <EditOutlined style={{ fontSize: 12 }} />
                {tWorkflow('actions.edit')}
              </button>
            )}
            <button type='button' className='bodyPointerMenuItem bodyPointerMenuItem--danger' onClick={remove}>
              <DeleteOutlined style={{ fontSize: 12 }} />
              {tWorkflow('actions.delete')}
            </button>
          </div>
        </div>
      ) : null}
      {editorPos && connection && currentMethod
        ? createPortal(
            <div style={{ position: 'fixed', inset: 0, zIndex: 12000, pointerEvents: 'none' }}>
              <div
                className='bodyPointerEditorPopup'
                style={{
                  position: 'absolute',
                  top: editorPos.top,
                  left: editorPos.left,
                  width: 560,
                  maxWidth: 'calc(100vw - 48px)',
                  pointerEvents: 'auto',
                }}
              >
                <LegacyBodyReferenceGenerator
                  connection={connection}
                  currentMethod={currentMethod}
                  onApply={(reference) => {
                    onEdit?.(pointer, pointers, reference);
                    setEditorPos(null);
                  }}
                />
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
