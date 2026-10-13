import { Select } from 'antd';
import { CopyButton } from '@shared/ui/actions/CopyButton';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { ReferenceOptionLabel } from '../ReferenceOptionLabel/ReferenceOptionLabel';
import { groupReferenceOptions, REFERENCE_GROUP_LABEL_KEY } from '../requestReferenceOptions';
import type { LegacyResponseFieldSelectProps } from './LegacyResponseFieldSelect.types';
import { useLegacyResponseFieldSelect } from './useLegacyResponseFieldSelect';
import '../bodyLegacy.css';

/** Above the method dialog the picker was written for, and below the confirm
 *  dialog at 20000 that can also host it. */
const DEFAULT_POPUP_Z_INDEX = 13010;

export function LegacyResponseFieldSelect({ method, type, value, disabled, iterators = [], popupZIndex, onChange }: LegacyResponseFieldSelectProps) {
  const state = useLegacyResponseFieldSelect({ method, type, value, disabled, iterators, onChange });
  const { t } = useI18n('workflow');
  const zIndex = popupZIndex ?? DEFAULT_POPUP_Z_INDEX;

  return (
    <div
      ref={state.wrapperRef}
      className='selectCopyHost'
      onMouseDownCapture={() => {
        state.userInteractionRef.current = true;
      }}
      onKeyDownCapture={() => {
        state.userInteractionRef.current = true;
      }}
    >
      <CopyButton value={state.displayPath} className='selectCopyButton' />
      {/* Inside the host, not around it: the primitive's wrapper span would take
          the host's place in the generator row and shrink it. Always mounted so
          toggling the warning doesn't remount the select and drop focus. */}
      <Tooltip content={state.isUnknownPath ? t('references.unknownPath') : null} zIndex={zIndex} maxWidth={320}>
        <Select
          placeholder={state.placeholder}
          value={undefined}
          searchValue={state.searchValue}
          className='bodyLegacyGeneratorSelect'
          size='large'
          disabled={state.isDisabled}
          showSearch
          filterOption={false}
          getPopupContainer={() => document.body}
          styles={{ popup: { root: { zIndex } } }}
          status={state.isUnknownPath ? 'warning' : undefined}
          options={groupReferenceOptions(state.options).map((group) => ({
            key: group.kind,
            label: t(REFERENCE_GROUP_LABEL_KEY[group.kind]),
            // `title` is antd's native hover text for an option: it lives inside the
            // popup, so unlike a Tooltip it can't open behind the dialog stack.
            options: group.options.map((option) => ({
              value: option.value, title: option.label, label: <ReferenceOptionLabel option={option} />,
            })),
          }))}
          notFoundContent={state.notFoundContent}
          open={state.open}
          onSearch={state.onSearch}
          onSelect={state.onSelect}
          onFocus={state.onFocus}
          onBlur={state.onBlur}
          onClear={state.onClear}
          allowClear
        />
      </Tooltip>
    </div>
  );
}
