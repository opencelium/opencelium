import { ApiOutlined, LinkOutlined, PlusOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import { LegacyWebhookReferenceSelect } from '../LegacyWebhookReferenceSelect/LegacyWebhookReferenceSelect';
import { LegacyResponseFieldSelect } from '../LegacyResponseFieldSelect/LegacyResponseFieldSelect';
import { Radio } from '@shared/ui/primitives/Radio';
import type { ResponseType } from '../requestReferenceOptions';
import type { LegacyBodyReferenceGeneratorProps } from './LegacyBodyReferenceGenerator.types';

/** The same letters the switch is labelled with, so a named part and a chosen
 *  one read as the same thing seen twice. */
const RESPONSE_PART_LETTER: Record<ResponseType, string> = {
  body: 'B',
  header: 'H',
  status: 'S',
};
import { ReferenceMethodSelect } from '../../../method-select/ReferenceMethodSelect';
import { useLegacyBodyReferenceGenerator } from './useLegacyBodyReferenceGenerator';
import '../bodyLegacy.css';

export function LegacyBodyReferenceGenerator({ connection, currentMethod, onApply, showWebhookOption = true, popupZIndex, defaultMethodId, resetKey,
  applyOnSelect, value, readOnly, showMethod = true,
  responsePartAsText }: LegacyBodyReferenceGeneratorProps) {
  const state = useLegacyBodyReferenceGenerator({
    connection, currentMethod, onApply, showWebhookOption, defaultMethodId, resetKey,
    applyOnSelect, value, showMethod, readOnly,
  });

  return (
    <div className={state.shellClassName}>
      {showWebhookOption ? (
        <div className='bodyLegacyGeneratorSwitch compactRadioGroup'>
          <Radio
            checked={state.referenceType === 'direct'}
            onChange={() => state.setReferenceType('direct')}
            label={<span className='bodyLegacyRadioIcon'><ApiOutlined /></span>}
          />
          <Radio
            checked={state.referenceType === 'webhook'}
            onChange={() => state.setReferenceType('webhook')}
            label={<span className='bodyLegacyRadioIcon'><LinkOutlined /></span>}
          />
        </div>
      ) : null}
      {state.referenceType === 'direct' ? (
        <>
          {/* Keyed on the seed so a reset gives a genuinely new control rather
              than one asked to forget: antd keeps display state of its own —
              the search text and the selected item — and clearing what we own
              does not always clear what it owns. The key changes only when the
              host starts this generator over, so ordinary picking is unaffected. */}
          {showMethod && (
            <ReferenceMethodSelect key={`method-${state.resetSeed}`}
              methods={state.methods} selectedMethod={state.selectedMethod}
              methodId={state.methodId} disabled={readOnly}
              popupZIndex={popupZIndex} onChange={state.selectMethod} />
          )}
          {responsePartAsText ? (
            <span className='bodyLegacyGeneratorResponseText bodyLegacyRadioIcon'
              title={state.responseType}>
              {RESPONSE_PART_LETTER[state.responseType]}
            </span>
          ) : (
            <div className='bodyLegacyGeneratorResponse compactRadioGroup'>
              <Radio
                checked={state.responseType === 'body'} disabled={readOnly}
                onChange={() => state.selectResponseType('body')}
                label={<span className='bodyLegacyRadioIcon'>B</span>}
              />
              <Radio
                checked={state.responseType === 'header'} disabled={readOnly}
                onChange={() => state.selectResponseType('header')}
                label={<span className='bodyLegacyRadioIcon'>H</span>}
              />
              <Radio
                checked={state.responseType === 'status'} disabled={readOnly}
                onChange={() => state.selectResponseType('status')}
                label={<span className='bodyLegacyRadioIcon'>S</span>}
              />
            </div>
          )}
          {/* Keyed on the method as well: its options come from that method's
              response, and a control still showing the previous one's path is
              the same staleness in a different place. */}
          <LegacyResponseFieldSelect
            key={`field-${state.resetSeed}-${state.methodId ?? ''}-${state.responseType}`}
            method={state.selectedMethod} type={state.responseType} value={state.field}
            disabled={readOnly || !state.methodId} iterators={state.iterators}
            popupZIndex={popupZIndex}
            onChange={state.setField}
          />
          {!applyOnSelect && !readOnly && (
            <Button
              type='text'
              className='bodyLegacyGeneratorAction'
              icon={<PlusOutlined />}
              disabled={!state.selectedMethod || !state.field} onClick={state.applyDirect}
            />
          )}
        </>
      ) : (
        <>
          <LegacyWebhookReferenceSelect value={state.webhookValue} onChange={state.setWebhookValue} />
          <Button
            type='text'
            className='bodyLegacyGeneratorAction'
            icon={<PlusOutlined />}
            disabled={!state.webhookValue} onClick={state.applyWebhook}
          />
        </>
      )}
    </div>
  );
}
