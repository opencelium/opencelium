import { Radio } from '@shared/ui/primitives/Radio';
import { Select } from '@shared/ui/primitives/Select';
import type { ResponseType } from '../../body-editor/requestReferenceOptions';
import type { ReferenceMethodFieldControlsProps } from './ReferenceMethodFieldControls.types';
import '../referenceGenerator.css';

const RESPONSE_LABELS: Record<ResponseType, string> = { body: 'B', header: 'H', status: 'S' };

export function ReferenceMethodFieldControls(props: ReferenceMethodFieldControlsProps) {
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
        <input ref={props.fieldInputRef} type="text" value={props.searchValue}
          onChange={(event) => props.onSearchChange(event.target.value)}
          onFocus={props.onFieldFocus} onBlur={props.onFieldBlur}
          placeholder={props.fieldPlaceholder} disabled={props.fieldDisabled}
          className="referenceFieldInput" />
      </div>
    </div>
  </div>;
}
