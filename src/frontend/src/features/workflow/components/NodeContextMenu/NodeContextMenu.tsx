/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ContextMenuEditor } from '../context-menu/ContextMenuEditor/ContextMenuEditor';
import type { NodeContextMenuProps } from './NodeContextMenu.types';
import { NodeContextMenuSections } from './NodeContextMenuSections';

export function NodeContextMenu({ menu, node, onClose, onChangeLabel, onOpenRequestEditor, onOpenConditionEditor, onShowResponse, onOpenAggregatorEditor }: NodeContextMenuProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [draftLabel, setDraftLabel] = useState('');

  useEffect(() => {
    if (!menu) return;
    const onPointerDown = (event: MouseEvent) => !ref.current?.contains(event.target as Node) && onClose();
    const onEscape = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    window.addEventListener('mousedown', onPointerDown);
    window.addEventListener('keydown', onEscape);
    return () => {
      window.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('keydown', onEscape);
    };
  }, [menu, onClose]);

  useEffect(() => {
    setIsEditingLabel(false);
    setDraftLabel(menu ? node?.data.subtitle || node?.data.title || '' : '');
  }, [menu, node]);

  useEffect(() => {
    if (isEditingLabel) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditingLabel]);

  if (!menu) return null;
  return createPortal(
    <div ref={ref} className="contextMenu" data-testid="workflow-context-menu" style={{ left: menu.x, top: menu.y }}>
      {isEditingLabel ? (
        <ContextMenuEditor
          inputRef={inputRef}
          value={draftLabel}
          onChange={setDraftLabel}
          onCancel={() => setIsEditingLabel(false)}
          onSave={() => {
            const nextLabel = draftLabel.trim();
            if (!nextLabel) return;
            onChangeLabel(menu.nodeId, nextLabel);
            onClose();
          }}
        />
      ) : (
        <NodeContextMenuSections menu={menu} node={node} onClose={onClose}
          onEditLabel={() => setIsEditingLabel(true)} onOpenRequestEditor={onOpenRequestEditor}
          onOpenConditionEditor={onOpenConditionEditor} onShowResponse={onShowResponse}
          onOpenAggregatorEditor={onOpenAggregatorEditor} />
      )}
    </div>,
    document.body,
  );
}
