import { useEffect, useMemo, useRef, useState } from 'react';
import { historyItems } from './historyPanel.data';
import { buildHistoryRows } from './historyPanel.utils';

type Props = { open: boolean; onClose: () => void };

export function useHistoryPanelState({ open, onClose }: Props) {
  const [items, setItems] = useState(historyItems);
  const [comments, setComments] = useState<Record<string, string>>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hoveredCommentId, setHoveredCommentId] = useState<string | null>(null);
  const [expandedCommentId, setExpandedCommentId] = useState<string | null>(null);
  const [expandedMetrics, setExpandedMetrics] = useState<Record<string, { width: number; shiftLeft: number }>>({});
  const [selectedId, setSelectedId] = useState<string | null>(historyItems[0]?.id ?? null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const panelRef = useRef<HTMLElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const commentRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const rows = useMemo(() => buildHistoryRows(items), [items]);

  useEffect(() => {
    setComments(Object.fromEntries(items.map((item) => [item.id, item.comment])));
  }, [items]);

  useEffect(() => {
    if (!open) return;
    const onEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (confirmId) return setConfirmId(null);
      if (menuId) return setMenuId(null);
      onClose();
    };
    const onPointerDown = (event: MouseEvent) => {
      if (menuRef.current?.contains(event.target as Node)) return;
      setMenuId(null);
    };
    window.addEventListener('keydown', onEscape);
    window.addEventListener('mousedown', onPointerDown);
    return () => {
      window.removeEventListener('keydown', onEscape);
      window.removeEventListener('mousedown', onPointerDown);
    };
  }, [confirmId, menuId, onClose, open]);

  const computeExpandedWidth = (id: string) => {
    const panelRect = panelRef.current?.getBoundingClientRect();
    const commentRect = commentRefs.current[id]?.getBoundingClientRect();
    if (!(panelRect && commentRect)) return;
    const width = Math.max(320, Math.floor(commentRect.right - panelRect.left - 16));
    const shiftLeft = Math.max(0, Math.floor(width - commentRect.width));
    setExpandedMetrics((current) =>
      current[id]?.width === width && current[id]?.shiftLeft === shiftLeft
        ? current
        : { ...current, [id]: { width, shiftLeft } },
    );
  };

  return {
    activeId,
    commentRefs,
    comments,
    confirmId,
    expandedCommentId,
    expandedMetrics,
    hoveredCommentId,
    items,
    menuId,
    menuRef,
    panelRef,
    rows,
    selectedId,
    setActiveId,
    setComments,
    setConfirmId,
    setExpandedCommentId,
    setHoveredCommentId,
    setItems,
    setMenuId,
    setSelectedId,
    computeExpandedWidth,
  };
}
