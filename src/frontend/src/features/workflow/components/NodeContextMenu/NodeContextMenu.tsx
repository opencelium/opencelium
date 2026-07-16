/* eslint-disable react-hooks/set-state-in-effect */
import { buildTestId } from '@shared/testing/testId';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ContextMenuEditor } from '../context-menu/ContextMenuEditor/ContextMenuEditor';
import { menuByType } from '../context-menu/contextMenuData';
import { buildContextMenuEntries, filterEntriesForSection } from '../context-menu/contextMenuEntries';
import type { NodeContextMenuProps } from './NodeContextMenu.types';

export function NodeContextMenu({ menu, node, onClose, onChangeLabel, onOpenRequestEditor, onOpenConditionEditor, onShowResponse, onOpenAggregatorEditor }: NodeContextMenuProps) {
  const { t } = useI18n('workflow');
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
  const sections = menuByType[menu.kind] || [];
  const entries = buildContextMenuEntries(sections);

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
        <div className="contextMenuSections">
          {sections.map((section) => (
            <div key={section.id} className="contextMenuSection">
              {filterEntriesForSection(section, entries).map((entry) =>
                entry.type === 'label' ? (
                  <div key={entry.id} className="contextMenuGroupLabel">{t(entry.labelKey)}</div>
                ) : (
                  <button
                    key={entry.id}
                    className={`contextMenuItem ${entry.indented ? 'contextMenuItemIndented' : ''}`}
                    type="button"
                    data-testid={buildTestId('workflow-context-menu', entry.item.id)}
                    onClick={() => {
                      if (entry.item.id === 'change-label') return setIsEditingLabel(true);
                      if (entry.item.id === 'open-config' && (node?.type === 'if' || node?.type === 'loop')) onOpenConditionEditor(menu.nodeId);
                      if (entry.item.id === 'edit-url') onOpenRequestEditor(menu.nodeId, 'url');
                      if (entry.item.id === 'edit-headers') onOpenRequestEditor(menu.nodeId, 'header');
                      if (entry.item.id === 'edit-body') onOpenRequestEditor(menu.nodeId, 'body');
                      if (entry.item.id === 'show-response') onShowResponse(menu.nodeId);
                      if (entry.item.id === 'configure-aggregator') onOpenAggregatorEditor(menu.nodeId);
                      onClose();
                    }}
                  >
                    {t(entry.item.labelKey)}
                  </button>
                ),
              )}
            </div>
          ))}
        </div>
      )}
    </div>,
    document.body,
  );
}
