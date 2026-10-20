import { Fragment } from 'react';
import { createPortal } from 'react-dom';
import { useNewFeature } from '@shared/ui/feedback/NewFeature/useNewFeature';
import { ReferenceOptionLabel } from '../../body-editor/ReferenceOptionLabel/ReferenceOptionLabel';
import { ReferenceGroupLabel } from '../../body-editor/ReferenceGroupLabel/ReferenceGroupLabel';
import { groupReferenceOptions } from '../../body-editor/requestReferenceOptions';
import type { ReferenceFieldDropdownProps } from './ReferenceFieldDropdown.types';
import '../referenceDropdowns.css';

// One above `.referenceDropdown` (referenceDropdowns.css), so the group header's tooltip clears the dropdown.
const GROUP_TOOLTIP_Z_INDEX = 4001;

export function ReferenceFieldDropdown({ open, position, dropdownRef, options,
  onSelect }: ReferenceFieldDropdownProps) {
  const { markSeen } = useNewFeature('workflow-reference-operations');
  if (!open || !position) return null;
  return createPortal(<div ref={dropdownRef} className="referenceDropdown referenceFieldDropdown"
    style={{ top: position.top, left: position.left, width: position.width }}>
    {groupReferenceOptions(options).map((group) => <Fragment key={group.kind}>
      <div className="referenceDropdownGroupLabel">
        <ReferenceGroupLabel kind={group.kind} zIndex={GROUP_TOOLTIP_Z_INDEX} />
      </div>
      {group.options.map((option) => <div key={option.value} className="referenceDropdownOption"
        onMouseDown={(event) => event.preventDefault()} onClick={() => {
          if (option.kind === 'operation') markSeen();
          onSelect(option);
        }}>
        <ReferenceOptionLabel option={option} />
      </div>)}
    </Fragment>)}
  </div>, document.body);
}
