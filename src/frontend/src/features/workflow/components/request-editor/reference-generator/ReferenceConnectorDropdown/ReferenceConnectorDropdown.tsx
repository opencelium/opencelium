import { createPortal } from 'react-dom';
import type { ReferenceConnectorDropdownProps } from './ReferenceConnectorDropdown.types';
import '../referenceDropdowns.css';

export function ReferenceConnectorDropdown({ open, position, dropdownRef, options,
  onSelect }: ReferenceConnectorDropdownProps) {
  if (!open || !position) return null;
  return createPortal(<div ref={dropdownRef}
    className="referenceDropdown referenceConnectorDropdown"
    style={{ top: position.top, left: position.left, width: position.width }}>
    {options.map((option) => <div key={option.value}
      className="referenceDropdownOption referenceConnectorDropdownOption"
      onMouseDown={(event) => {
        event.preventDefault();
        onSelect(option.value);
      }}><span>{option.label}</span></div>)}
  </div>, document.body);
}
