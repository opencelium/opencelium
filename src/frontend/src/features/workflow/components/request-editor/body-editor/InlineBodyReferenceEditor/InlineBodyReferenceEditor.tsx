import { createPortal } from 'react-dom';
import { LegacyBodyReferenceGenerator } from '../LegacyBodyReferenceGenerator/LegacyBodyReferenceGenerator';
import type { InlineBodyReferenceEditorProps } from './InlineBodyReferenceEditor.types';
import { setLastBodyReferenceTriggerRect } from './inlineBodyReferencePosition';
import { useInlineBodyReferenceEditor } from './useInlineBodyReferenceEditor';

export { setLastBodyReferenceTriggerRect };

export function InlineBodyReferenceEditor({ referenceId, connection, currentMethod, submitEdit, onClose }: InlineBodyReferenceEditorProps) {
  const { hidden, popupRef, position } = useInlineBodyReferenceEditor(referenceId, onClose);

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
