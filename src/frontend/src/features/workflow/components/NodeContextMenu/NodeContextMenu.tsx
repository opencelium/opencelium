/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ContextMenuEditor } from '../context-menu/ContextMenuEditor/ContextMenuEditor';
import type { NodeContextMenuProps } from './NodeContextMenu.types';
import { placeContextMenu } from './contextMenuPlacement';
import { NodeContextMenuSections } from './NodeContextMenuSections';

export function NodeContextMenu({ menu, node, onClose, onChangeLabel, onOpenRequestEditor, onOpenConditionEditor, onShowResponse, onTryRequest, onOpenAggregatorEditor, onOpenConnectorEditor }: NodeContextMenuProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [draftLabel, setDraftLabel] = useState('');
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);

  // Re-placed whenever the menu changes size (a group expands, the label editor opens).
  useLayoutEffect(() => {
    const element = ref.current;
    if (!menu || !element) return;
    const place = () => setPosition(placeContextMenu({ x: menu.x, y: menu.y },
      { width: element.offsetWidth, height: element.offsetHeight },
      { width: window.innerWidth, height: window.innerHeight }));
    place();
    const observer = new ResizeObserver(place);
    observer.observe(element);
    return () => observer.disconnect();
  }, [menu]);

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
    <div ref={ref} className="contextMenu" data-testid="workflow-context-menu" style={position ?? { left: menu.x, top: menu.y, visibility: 'hidden' }}>
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
          onOpenConditionEditor={onOpenConditionEditor} onShowResponse={onShowResponse} onTryRequest={onTryRequest}
          onOpenAggregatorEditor={onOpenAggregatorEditor} onOpenConnectorEditor={onOpenConnectorEditor} />
      )}
    </div>,
    document.body,
  );
}
