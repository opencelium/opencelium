import type { ReferenceConnectorSelectProps } from './ReferenceConnectorSelect.types';
import '../referenceGenerator.css';

export function ReferenceConnectorSelect({ containerRef, label, value, placeholder,
  open, disabled, onToggle }: ReferenceConnectorSelectProps) {
  return <div className="referenceConnectorSelect" ref={containerRef}>
    <div className="referenceGeneratorLabel">{label}</div>
    <div className="referenceConnectorSelectControl" onClick={() => !disabled && onToggle()}>
      <span className={value ? undefined : 'referenceConnectorPlaceholder'}>
        {value || placeholder}
      </span>
      <span className="referenceConnectorArrow">{open ? '▲' : '▼'}</span>
    </div>
  </div>;
}
