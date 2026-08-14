import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import type { MouseEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useConfirm } from '@shared/ui/confirm/ConfirmDialogContext';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Loading } from '@shared/ui/primitives/Loading/Loading';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { parseEnhancementArg } from '../../utils/parseEnhancementArg';
import { LegacyBodyReferenceGenerator } from '../LegacyBodyReferenceGenerator/LegacyBodyReferenceGenerator';
import { useTestRun } from '../../../../test-run/useTestRun';
import type { BodyPointerProps } from './BodyPointer.types';
import './BodyPointer.css';
import {
    formatLiveReferenceValue,
    useLiveReferenceValue
} from "@features/workflow/components/request-editor/utils/useLiveReferenceValue.ts";

export function BodyPointer({ pointer, pointers, onClick, onRemove, onEdit, connection, currentMethod }: BodyPointerProps) {
  const [hovered, setHovered] = useState(false);
  const [menuBelow, setMenuBelow] = useState(false);
  const [editorPos, setEditorPos] = useState<{ left: number; top: number } | null>(null);
  const confirm = useConfirm();
  const { t: tWorkflow } = useI18n('workflow');
  // While a test run is paused, hovering is purely for inspecting the live
  // value — editing/removing a reference mid-inspection isn't a supported
  // action, so the edit/delete menu is suppressed entirely in that state.
  const isPaused = useTestRun()?.isPaused ?? false;
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
  // useLiveReferenceValue.ts. Resolution only fires once the chip is
  // actually hovered (`enabled: hovered` below), so opening a node with many
  // reference chips doesn't fire a request per chip. The rectangle itself
  // never changes appearance — the loading/resolved state only ever shows in
  // the hover tooltip, kept separate from the edit/delete menu below.
  const { value: liveValue, hasValue: hasLiveValue, isLoading: isLiveValueLoading } = useLiveReferenceValue(
    parsed,
    connection,
    currentMethod,
    hovered,
  );
  const liveValueText = hasLiveValue ? formatLiveReferenceValue(liveValue) : null;
  const tooltipContent = isLiveValueLoading ? (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      {staticTitle} = <Loading size="xs" inline />
    </span>
  ) : liveValueText !== null ? (
    `${staticTitle} = ${liveValueText}`
  ) : (
    staticTitle
  );

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

  const showMenu = (event: MouseEvent<HTMLDivElement>) => {
    const pointerRect = event.currentTarget.getBoundingClientRect();
    const scrollContainer = event.currentTarget.closest('.bodyLegacyJsonWrap');
    const containerTop = scrollContainer?.getBoundingClientRect().top ?? 0;
    setMenuBelow(pointerRect.top - containerTop < (canEdit ? 76 : 44));
    setHovered(true);
  };

  return (
    <div
      onClick={onClick}
      onMouseEnter={showMenu}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        float: 'left',
        margin: '7px 2px',
        width: 20,
        height: 10,
        cursor: 'pointer',
      }}
    >
      <Tooltip content={tooltipContent}>
        <div style={{ width: 20, height: 10, background: color }} />
      </Tooltip>
      {hovered && !isPaused ? (
        <div className={`bodyPointerMenu ${menuBelow ? 'bodyPointerMenu--below' : ''}`}>
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
