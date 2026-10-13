import { createPortal } from 'react-dom';
import { ReferenceOptionLabel } from '../../body-editor/ReferenceOptionLabel/ReferenceOptionLabel';
import type { ReferenceFieldDropdownProps } from './ReferenceFieldDropdown.types';
import '../referenceDropdowns.css';

export function ReferenceFieldDropdown({ open, position, dropdownRef, options,
  onSelect }: ReferenceFieldDropdownProps) {
  if (!open || !position) return null;
  return createPortal(<div ref={dropdownRef} className="referenceDropdown referenceFieldDropdown"
    style={{ top: position.top, left: position.left, width: position.width }}>
    {options.map((option) => <div key={option.value} className="referenceDropdownOption"
      onMouseDown={(event) => event.preventDefault()} onClick={() => onSelect(option)}>
      <ReferenceOptionLabel label={option.label} value={option.value} />
    </div>)}
  </div>, document.body);
}
