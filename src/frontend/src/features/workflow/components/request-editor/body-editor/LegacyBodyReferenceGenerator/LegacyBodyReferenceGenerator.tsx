import { ApiOutlined, LinkOutlined, PlusOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import { useMemo, useState } from 'react';
import { buildReferenceValue, getIteratorsForMethod, type ResponseType } from '../requestReferenceOptions';
import { LegacyWebhookReferenceSelect } from '../LegacyWebhookReferenceSelect/LegacyWebhookReferenceSelect';
import { LegacyResponseFieldSelect } from '../LegacyResponseFieldSelect/LegacyResponseFieldSelect';
import { webhookSnippet } from '../bodyWebhook';
import { Radio } from '@shared/ui/primitives/Radio';
import { getDuplicateMethodIndexByColor } from '../../../../utils/methodColor';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { LegacyBodyReferenceGeneratorProps } from './LegacyBodyReferenceGenerator.types';
import { getReferenceMethods } from './legacyBodyReferenceGenerator.utils';
import { ReferenceMethodSelect } from './ReferenceMethodSelect';
import '../bodyLegacy.css';

export function LegacyBodyReferenceGenerator({ connection, currentMethod, onApply, showWebhookOption = true }: LegacyBodyReferenceGeneratorProps) {
  const { t } = useI18n('workflow');
  const [referenceType, setReferenceType] = useState<'direct' | 'webhook'>('direct');
  const [responseType, setResponseType] = useState<ResponseType>('body');
  const [methodId, setMethodId] = useState<string>();
  const [field, setField] = useState<string>();
  const [webhookValue, setWebhookValue] = useState<string>();

  const methods = useMemo(() => getReferenceMethods(connection, currentMethod), [connection, currentMethod]);

  const selectedMethod = methods.find((method) => method.id === methodId);
  const duplicateIndexByColor = useMemo(() => getDuplicateMethodIndexByColor(methods), [methods]);
  const currentMethodIterators = useMemo(
    () => getIteratorsForMethod(connection, currentMethod),
    [connection, currentMethod],
  );
  const shellClassName = [
    'bodyLegacyGeneratorShell',
    referenceType === 'webhook' ? 'bodyLegacyGeneratorShellWebhook' : '',
    !showWebhookOption ? 'bodyLegacyGeneratorShellNoToggle' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={shellClassName}>
      {showWebhookOption ? (
        <div className='bodyLegacyGeneratorSwitch compactRadioGroup'>
          <Radio
            checked={referenceType === 'direct'}
            onChange={() => setReferenceType('direct')}
            label={<span className='bodyLegacyRadioIcon'><ApiOutlined /></span>}
          />
          <Radio
            checked={referenceType === 'webhook'}
            onChange={() => setReferenceType('webhook')}
            label={<span className='bodyLegacyRadioIcon'><LinkOutlined /></span>}
          />
        </div>
      ) : null}
      {referenceType === 'direct' ? (
        <>
          <ReferenceMethodSelect methods={methods} selectedMethod={selectedMethod} methodId={methodId}
            duplicateIndexByColor={duplicateIndexByColor}
            onChange={(value) => { setMethodId(value); setField(undefined); }} />
          <div className='bodyLegacyGeneratorResponse compactRadioGroup'>
            <Radio
              checked={responseType === 'body'}
              onChange={() => { setResponseType('body'); setField(undefined); }}
              label={<span className='bodyLegacyRadioIcon'>B</span>}
            />
            <Radio
              checked={responseType === 'header'}
              onChange={() => { setResponseType('header'); setField(undefined); }}
              label={<span className='bodyLegacyRadioIcon'>H</span>}
            />
            <Radio
              checked={responseType === 'status'}
              onChange={() => { setResponseType('status'); setField('status'); }}
              label={<span className='bodyLegacyRadioIcon'>S</span>}
            />
          </div>
          <LegacyResponseFieldSelect
            method={selectedMethod}
            type={responseType}
            value={field}
            disabled={!methodId}
            iterators={currentMethodIterators}
            onChange={setField}
          />
          <Button
            type='text'
            className='bodyLegacyGeneratorAction'
            icon={<PlusOutlined />}
            disabled={!selectedMethod || !field}
            onClick={() => {
              if (!(selectedMethod && field)) return;
              onApply(buildReferenceValue(selectedMethod.color, responseType, field));
              setField(undefined);
            }}
          />
        </>
      ) : (
        <>
          <LegacyWebhookReferenceSelect value={webhookValue} onChange={setWebhookValue} />
          <Button
            type='text'
            className='bodyLegacyGeneratorAction'
            icon={<PlusOutlined />}
            disabled={!webhookValue}
            onClick={() => {
              if (!webhookValue) return;
              onApply(webhookSnippet(webhookValue));
              setWebhookValue(undefined);
            }}
          />
        </>
      )}
    </div>
  );
}
