import { Select } from 'antd';
import { CopyButton } from '@shared/ui/actions/CopyButton';
import type { LegacyResponseFieldSelectProps } from './LegacyResponseFieldSelect.types';
import { useLegacyResponseFieldSelect } from './useLegacyResponseFieldSelect';
import '../bodyLegacy.css';

export function LegacyResponseFieldSelect({ method, type, value, disabled, iterators = [], onChange }: LegacyResponseFieldSelectProps) {
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
        styles={{ popup: { root: { zIndex: 13010 } } }}
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
