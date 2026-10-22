import { CloseCircleFilled } from '@ant-design/icons';
import { AutoComplete, Input } from 'antd';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { CopyButton } from '@shared/ui/actions/CopyButton';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { ReferenceOptionLabel } from '../ReferenceOptionLabel/ReferenceOptionLabel';
import { ReferenceGroupLabel } from '../ReferenceGroupLabel/ReferenceGroupLabel';
import { groupReferenceOptions } from '../requestReferenceOptions';
import type { LegacyResponseFieldSelectProps } from './LegacyResponseFieldSelect.types';
import { useLegacyResponseFieldSelect } from './useLegacyResponseFieldSelect';
import { useFitWidthOnFocus } from './useFitWidthOnFocus';
import { useReferenceFeedbackTooltip } from '../useReferenceFeedbackTooltip';
import '../bodyLegacy.css';

/** Above the method dialog the picker was written for, and below the confirm
 *  dialog at 20000 that can also host it. */
export const DEFAULT_POPUP_Z_INDEX = 13010;

export function LegacyResponseFieldSelect({ method, type, value, disabled, iterators = [], popupZIndex, onChange,
  onSubmit }: LegacyResponseFieldSelectProps) {
  const { t } = useI18n('workflow');
  const state = useLegacyResponseFieldSelect({ method, type, value, disabled, iterators, onChange });
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
        <AutoComplete
          placeholder={state.placeholder}
          value={state.searchValue}
          className='bodyLegacyGeneratorSelect referenceFieldPathSelect'
          style={fit.style}
          disabled={state.isDisabled}
          filterOption={false}
          defaultActiveFirstOption
          getPopupContainer={() => document.body}
          popupMatchSelectWidth={420}
          styles={{ popup: { root: { zIndex } } }}
          status={state.pathFeedback?.severity}
          options={groupReferenceOptions(state.options).map((group) => ({
            key: group.kind,
            label: <ReferenceGroupLabel kind={group.kind} zIndex={zIndex + 1} />,
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
          allowClear={{ clearIcon: <Tooltip content={t('references.clearField')} zIndex={zIndex + 1}>
            <CloseCircleFilled />
          </Tooltip> }}
        >
          {/* A textarea, not an input, so a path longer than the widest the field
              may grow wraps onto more lines instead of scrolling sideways. */}
          <Input.TextArea size='large' className='referenceFieldPathInput'
            status={state.pathFeedback?.severity}
            autoSize={fit.isFocused ? { minRows: 1 } : { minRows: 1, maxRows: 1 }}
            wrap={fit.isFocused ? 'soft' : 'off'}
            onKeyDown={(event) => {
              if (event.key !== 'Enter' || event.nativeEvent.isComposing) return;
              event.preventDefault();
              // With the list open, Enter picks the highlighted option instead.
              const isListShown = state.open && state.options.length > 0;
              if (!isListShown && state.searchValue) onSubmit?.();
            }} />
        </AutoComplete>
      </Tooltip>
    </div>
  );
}
