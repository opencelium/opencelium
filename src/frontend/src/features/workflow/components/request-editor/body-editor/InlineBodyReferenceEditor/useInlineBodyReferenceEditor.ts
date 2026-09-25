import { useEffect, useMemo, useRef, useState } from 'react';
import { getInlineBodyReferencePosition } from './inlineBodyReferencePosition';

export function useInlineBodyReferenceEditor(referenceId: string, onClose?: () => void) {
  const popupRef = useRef<HTMLDivElement | null>(null);
  const [hidden, setHidden] = useState(false);
  const position = useMemo(getInlineBodyReferencePosition, []);

  useEffect(() => setHidden(false), [referenceId]);

  useEffect(() => {
    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target || !popupRef.current || popupRef.current.contains(target)) return;
      if (target.closest('.bodyLegacyWebhookModalRoot') || target.closest('.ant-select-dropdown')) {
        return;
      }
      setHidden(true);
      onClose?.();
    };
    document.addEventListener('mousedown', onMouseDown, true);
    return () => document.removeEventListener('mousedown', onMouseDown, true);
  }, [onClose]);

  return { hidden, popupRef, position };
}
