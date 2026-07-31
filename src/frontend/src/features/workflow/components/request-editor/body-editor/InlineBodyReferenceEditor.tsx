import { createPortal } from 'react-dom';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Connection, MethodWithId } from '../../../types/connection';
import { LegacyBodyReferenceGenerator } from './LegacyBodyReferenceGenerator';

type TriggerRect = {
  left: number;
  top: number;
  width: number;
  height: number;
  containerLeft?: number;
  containerRight?: number;
};

let lastBodyReferenceTriggerRect: TriggerRect | null = null;

export const setLastBodyReferenceTriggerRect = (rect: TriggerRect | null) => {
  lastBodyReferenceTriggerRect = rect;
};

type Props = {
  referenceId: string;
  connection: Connection;
  currentMethod: MethodWithId;
  submitEdit: () => void;
  onClose?: () => void;
};

export function InlineBodyReferenceEditor({ referenceId, connection, currentMethod, submitEdit, onClose }: Props) {
  const popupRef = useRef<HTMLDivElement | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    setHidden(false);
  }, [referenceId]);

  useEffect(() => {
    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target || !popupRef.current) return;
      if (popupRef.current.contains(target)) return;
      if (
        target.closest('.bodyLegacyWebhookModalRoot') ||
        target.closest('.ant-select-dropdown')
      ) {
        return;
      }
      setHidden(true);
      onClose?.();
    };

    document.addEventListener('mousedown', onMouseDown, true);
    return () => document.removeEventListener('mousedown', onMouseDown, true);
  }, [onClose]);

  const position = useMemo(() => {
    const rect = lastBodyReferenceTriggerRect;
    const width = 560;
    const margin = 16;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (!rect) {
      return {
        left: Math.max(margin, (viewportWidth - width) / 2),
        top: 120,
      };
    }

    const preferredLeft = rect.left + 12;
    const minLeft = Math.max(margin, rect.containerLeft ?? margin);
    const maxLeft = Math.max(
      minLeft,
      Math.min(
        viewportWidth - width - margin,
        (rect.containerRight ?? viewportWidth - margin) - width - 8,
      ),
    );
    const left = Math.min(
      Math.max(minLeft, preferredLeft),
      maxLeft,
    );
    const top = Math.min(
      Math.max(margin, rect.top + rect.height + 6),
      Math.max(margin, viewportHeight - 160),
    );

    return { left, top };
  }, []);

  if (hidden) return null;

  return createPortal(
    <>
      <span id={referenceId} style={{ display: 'none' }} />
      <div style={{ position: 'fixed', inset: 0, zIndex: 12000, pointerEvents: 'none' }}>
        <div
          ref={popupRef}
          style={{
            position: 'absolute',
            top: position.top,
            left: position.left,
            width: 560,
            maxWidth: 'calc(100vw - 48px)',
            zIndex: 1,
            pointerEvents: 'auto',
          }}
        >
          <LegacyBodyReferenceGenerator
            connection={connection}
            currentMethod={currentMethod}
            onApply={(reference) => {
              const element = document.getElementById(referenceId);
              if (!element) return;
              element.innerText = reference;
              submitEdit();
            }}
          />
        </div>
      </div>
    </>,
    document.body,
  );
}
