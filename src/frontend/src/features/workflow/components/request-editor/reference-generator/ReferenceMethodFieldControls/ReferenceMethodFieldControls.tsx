import { Radio } from '@shared/ui/primitives/Radio';
import { Select } from '@shared/ui/primitives/Select';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import type { ResponseType } from '../../body-editor/requestReferenceOptions';
import { useReferenceFeedbackTooltip } from '../../body-editor/useReferenceFeedbackTooltip';
import type { ReferenceMethodFieldControlsProps } from './ReferenceMethodFieldControls.types';
import '../referenceGenerator.css';

// Matches the generator's own dropdowns (referenceDropdowns.css), which sit above the method dialog.
const FIELD_WARNING_Z_INDEX = 4000;

const FEEDBACK_CLASS = { error: 'referenceFieldInputError', warning: 'referenceFieldInputWarning' } as const;

const RESPONSE_LABELS: Record<ResponseType, string> = { body: 'B', header: 'H', status: 'S' };

export function ReferenceMethodFieldControls(props: ReferenceMethodFieldControlsProps) {
  const feedbackTooltip = useReferenceFeedbackTooltip(props.fieldFeedback);
  return <div className="referenceMethodFieldRow">
    <div className="referenceMethodSelect">
      <div className="referenceGeneratorLabel">{props.methodLabel}</div>
      <Select value={props.methodId || undefined} options={props.methodOptions}
        onChange={props.onMethodChange} placeholder={props.methodPlaceholder}
        disabled={props.methodDisabled} sortOptions={false} />
    </div>
    <div className="referenceFieldSelect" ref={props.fieldContainerRef}>
      <div className="referenceGeneratorLabel">{props.fieldLabel}</div>
      <div className="referenceFieldInputRow">
        {props.responseTypes.length > 1 && <div className="compactRadioGroup referenceTypeRadios">
          {props.responseTypes.map((type) => <Radio key={type}
            checked={props.responseType === type} onChange={() => props.onResponseTypeChange(type)}
            label={<span className="referenceTypeLabel">{RESPONSE_LABELS[type]}</span>} />)}
        </div>}
        <div className="referenceFieldInputHost">
          <Tooltip content={props.fieldFeedback?.message ?? null} zIndex={FIELD_WARNING_Z_INDEX} maxWidth={320}
            open={feedbackTooltip.open} onOpenChange={feedbackTooltip.onOpenChange}>
            <input ref={props.fieldInputRef} type="text" value={props.searchValue}
              onChange={(event) => props.onSearchChange(event.target.value)}
              onFocus={props.onFieldFocus} onBlur={props.onFieldBlur}
              placeholder={props.fieldPlaceholder} disabled={props.fieldDisabled}
              className={['referenceFieldInput', props.fieldFeedback && FEEDBACK_CLASS[props.fieldFeedback.severity]]
                .filter(Boolean).join(' ')} />
          </Tooltip>
        </div>
      </div>
    </div>
  </div>;
}
