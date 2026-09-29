import { Select } from 'antd';
import { CopyButton } from '@shared/ui/actions/CopyButton';
import type { LegacyResponseFieldSelectProps } from './LegacyResponseFieldSelect.types';
import { useLegacyResponseFieldSelect } from './useLegacyResponseFieldSelect';
import '../bodyLegacy.css';

/** Above the method dialog the picker was written for, and below the confirm
 *  dialog at 20000 that can also host it. */
const DEFAULT_POPUP_Z_INDEX = 13010;

export function LegacyResponseFieldSelect({ method, type, value, disabled, iterators = [], popupZIndex, onChange }: LegacyResponseFieldSelectProps) {
  const state = useLegacyResponseFieldSelect({ method, type, value, disabled, iterators, onChange });

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
        styles={{ popup: { root: { zIndex: popupZIndex ?? DEFAULT_POPUP_Z_INDEX } } }}
        options={state.options}
        notFoundContent={state.notFoundContent}
        open={state.open}
        onSearch={state.onSearch}
        onSelect={state.onSelect}
        onFocus={state.onFocus}
        onBlur={state.onBlur}
        onClear={state.onClear}
        allowClear
      />
    </div>
  );
}
