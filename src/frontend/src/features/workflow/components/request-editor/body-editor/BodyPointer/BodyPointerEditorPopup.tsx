import { createPortal } from 'react-dom';
import { LegacyBodyReferenceGenerator } from '../LegacyBodyReferenceGenerator/LegacyBodyReferenceGenerator';
import type { BodyPointerProps } from './BodyPointer.types';

type Props = Pick<BodyPointerProps, 'connection' | 'currentMethod'> & {
  position: { left: number; top: number } | null;
  onApply: (reference: string) => void;
};

export function BodyPointerEditorPopup({ connection, currentMethod, position, onApply }: Props) {
  if (!position || !connection || !currentMethod) return null;

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 12000, pointerEvents: 'none' }}>
      <div className='bodyPointerEditorPopup' style={{
        position: 'absolute', top: position.top, left: position.left, width: 560,
        maxWidth: 'calc(100vw - 48px)', pointerEvents: 'auto',
      }}>
        <LegacyBodyReferenceGenerator connection={connection} currentMethod={currentMethod}
          onApply={onApply} />
      </div>
    </div>,
    document.body,
  );
}
