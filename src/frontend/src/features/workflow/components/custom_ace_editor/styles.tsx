import type { CSSProperties, PropsWithChildren } from 'react';
import type { LimitedAceEditorCounterProps } from './interfaces';

export function LimitedAceEditorContainer({ children, style }: PropsWithChildren<{ style?: CSSProperties }>) {
  return <div style={{ position: 'relative', height: '100%', ...style }}>{children}</div>;
}

export function LimitedAceEditorCounter({ top, right, bottom, children }: PropsWithChildren<LimitedAceEditorCounterProps>) {
  return (
    <div style={{ position: 'absolute', bottom: top ? undefined : (bottom || '-10px'), top, right: right || '0', fontSize: 12, zIndex: 1 }}>
      {children}
    </div>
  );
}
