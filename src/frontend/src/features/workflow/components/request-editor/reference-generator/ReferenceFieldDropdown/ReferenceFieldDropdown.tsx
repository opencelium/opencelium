import { Fragment } from 'react';
import { createPortal } from 'react-dom';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { ReferenceOptionLabel } from '../../body-editor/ReferenceOptionLabel/ReferenceOptionLabel';
import { groupReferenceOptions, REFERENCE_GROUP_LABEL_KEY } from '../../body-editor/requestReferenceOptions';
import type { ReferenceFieldDropdownProps } from './ReferenceFieldDropdown.types';
import '../referenceDropdowns.css';

export function ReferenceFieldDropdown({ open, position, dropdownRef, options,
  onSelect }: ReferenceFieldDropdownProps) {
  const { t } = useI18n('workflow');
  if (!open || !position) return null;
  return createPortal(<div ref={dropdownRef} className="referenceDropdown referenceFieldDropdown"
    style={{ top: position.top, left: position.left, width: position.width }}>
    {groupReferenceOptions(options).map((group) => <Fragment key={group.kind}>
      <div className="referenceDropdownGroupLabel">{t(REFERENCE_GROUP_LABEL_KEY[group.kind])}</div>
      {group.options.map((option) => <div key={option.value} className="referenceDropdownOption"
        onMouseDown={(event) => event.preventDefault()} onClick={() => onSelect(option)}>
        <ReferenceOptionLabel option={option} />
      </div>)}
    </Fragment>)}
  </div>, document.body);
}
