import { Select } from 'antd';
import { CopyButton } from '@shared/ui/actions/CopyButton';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { ReferenceOptionLabel } from '../ReferenceOptionLabel/ReferenceOptionLabel';
import { groupReferenceOptions, REFERENCE_GROUP_LABEL_KEY } from '../requestReferenceOptions';
import type { LegacyResponseFieldSelectProps } from './LegacyResponseFieldSelect.types';
import { useLegacyResponseFieldSelect } from './useLegacyResponseFieldSelect';
import { useFitWidthOnFocus } from './useFitWidthOnFocus';
import { useReferenceFeedbackTooltip } from '../useReferenceFeedbackTooltip';
import '../bodyLegacy.css';

/** Above the method dialog the picker was written for, and below the confirm
 *  dialog at 20000 that can also host it. */
const DEFAULT_POPUP_Z_INDEX = 13010;

export function LegacyResponseFieldSelect({ method, type, value, disabled, iterators = [], popupZIndex, onChange }: LegacyResponseFieldSelectProps) {
  const state = useLegacyResponseFieldSelect({ method, type, value, disabled, iterators, onChange });
  const { t } = useI18n('workflow');
  const zIndex = popupZIndex ?? DEFAULT_POPUP_Z_INDEX;
  const fit = useFitWidthOnFocus(state.wrapperRef, state.searchValue);
  const feedbackTooltip = useReferenceFeedbackTooltip(state.pathFeedback);

  return (
    <div
      ref={state.wrapperRef}
      className={['selectCopyHost', fit.isExpanded && 'isFitExpanded', fit.isTailShown && 'isTailShown']
        .filter(Boolean).join(' ')}
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
      <Tooltip content={state.pathFeedback?.message ?? null} zIndex={zIndex} maxWidth={320}
        open={feedbackTooltip.open} onOpenChange={feedbackTooltip.onOpenChange}>
        <Select
          placeholder={state.placeholder}
          value={undefined}
          searchValue={state.searchValue}
          className='bodyLegacyGeneratorSelect'
          style={fit.style}
          size='large'
          disabled={state.isDisabled}
          showSearch
          filterOption={false}
          getPopupContainer={() => document.body}
          popupMatchSelectWidth={420}
          styles={{ popup: { root: { zIndex } } }}
          status={state.pathFeedback?.severity}
          options={groupReferenceOptions(state.options).map((group) => ({
            key: group.kind,
            label: t(REFERENCE_GROUP_LABEL_KEY[group.kind]),
            options: group.options.map((option) => ({
              value: option.value, label: <ReferenceOptionLabel option={option} />,
            })),
          }))}
          notFoundContent={state.notFoundContent}
          open={state.open}
          onSearch={state.onSearch}
          onSelect={state.onSelect}
          onFocus={() => {
            fit.onFocus();
            state.onFocus();
          }}
          onBlur={() => {
            fit.onBlur();
            state.onBlur();
          }}
          onClear={state.onClear}
          allowClear
        />
      </Tooltip>
    </div>
  );
}
