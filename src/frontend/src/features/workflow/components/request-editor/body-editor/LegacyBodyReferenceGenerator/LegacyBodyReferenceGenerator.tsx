import { ApiOutlined, LinkOutlined, PlusOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import { LegacyWebhookReferenceSelect } from '../LegacyWebhookReferenceSelect/LegacyWebhookReferenceSelect';
import { LegacyResponseFieldSelect } from '../LegacyResponseFieldSelect/LegacyResponseFieldSelect';
import { Radio } from '@shared/ui/primitives/Radio';
import type { LegacyBodyReferenceGeneratorProps } from './LegacyBodyReferenceGenerator.types';
import { ReferenceMethodSelect } from './ReferenceMethodSelect';
import { useLegacyBodyReferenceGenerator } from './useLegacyBodyReferenceGenerator';
import '../bodyLegacy.css';

export function LegacyBodyReferenceGenerator({ connection, currentMethod, onApply, showWebhookOption = true }: LegacyBodyReferenceGeneratorProps) {
  const state = useLegacyBodyReferenceGenerator({
    connection, currentMethod, onApply, showWebhookOption,
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
          <ReferenceMethodSelect methods={state.methods} selectedMethod={state.selectedMethod}
            methodId={state.methodId} duplicateIndexByColor={state.duplicateIndexByColor}
            onChange={state.selectMethod} />
          <div className='bodyLegacyGeneratorResponse compactRadioGroup'>
            <Radio
              checked={state.responseType === 'body'} onChange={() => state.selectResponseType('body')}
              label={<span className='bodyLegacyRadioIcon'>B</span>}
            />
            <Radio
              checked={state.responseType === 'header'} onChange={() => state.selectResponseType('header')}
              label={<span className='bodyLegacyRadioIcon'>H</span>}
            />
            <Radio
              checked={state.responseType === 'status'} onChange={() => state.selectResponseType('status')}
              label={<span className='bodyLegacyRadioIcon'>S</span>}
            />
          </div>
          <LegacyResponseFieldSelect
            method={state.selectedMethod} type={state.responseType} value={state.field}
            disabled={!state.methodId} iterators={state.iterators} onChange={state.setField}
          />
          <Button
            type='text'
            className='bodyLegacyGeneratorAction'
            icon={<PlusOutlined />}
            disabled={!state.selectedMethod || !state.field} onClick={state.applyDirect}
          />
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
