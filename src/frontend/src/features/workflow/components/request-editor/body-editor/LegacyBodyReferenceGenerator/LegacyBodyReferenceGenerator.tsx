import { PlusOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import { LegacyWebhookReferenceSelect } from '../LegacyWebhookReferenceSelect/LegacyWebhookReferenceSelect';
import { DEFAULT_POPUP_Z_INDEX, LegacyResponseFieldSelect } from '../LegacyResponseFieldSelect/LegacyResponseFieldSelect';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { GlobalVariableSelect } from '@entities/globalVariable/ui/picker/GlobalVariableSelect';
import { useGlobalPickerScope } from '@entities/globalVariable/ui/picker/globalPicker';
import type { LegacyBodyReferenceGeneratorProps } from './LegacyBodyReferenceGenerator.types';
import { ReferenceSourceSelect } from '../../../reference-source/ReferenceSourceSelect';
import { ResponseTypeSelect } from '../../../reference-source/ResponseTypeSelect';
import { RESPONSE_PART_LETTER } from '../../../reference-source/referenceSource.types';
import { ReferenceMethodSelect } from '../../../method-select/ReferenceMethodSelect';
import { useLegacyBodyReferenceGenerator, type GeneratorReferenceType } from './useLegacyBodyReferenceGenerator';
import '../bodyLegacy.css';

export function LegacyBodyReferenceGenerator({ connection, currentMethod, onApply, showWebhookOption = true, autoFocus, popupZIndex, defaultMethodId, resetKey,
  applyOnSelect, value, readOnly, showMethod = true,
  responsePartAsText, canPickScripts = false }: LegacyBodyReferenceGeneratorProps) {
  const { t } = useI18n('workflow');
  const tooltipZIndex = (popupZIndex ?? DEFAULT_POPUP_Z_INDEX) + 1;
  // Read-only and apply-on-select hosts (the delete dialog's remap table) swap one method
  // reference for another, so they keep to methods.
  const hasGlobalOption = useGlobalPickerScope() !== null && !readOnly && !applyOnSelect;
  const hasSourceSwitch = showWebhookOption || hasGlobalOption;
  const sources: GeneratorReferenceType[] = [
    'direct',
    ...(showWebhookOption ? ['webhook' as const] : []),
    ...(hasGlobalOption ? ['global' as const] : []),
  ];
  const state = useLegacyBodyReferenceGenerator({
    connection, currentMethod, onApply, showWebhookOption: hasSourceSwitch, defaultMethodId, resetKey,
    applyOnSelect, value, showMethod, readOnly,
  });

  return (
    <div className={state.shellClassName} data-testid='workflow-reference-generator'>
      {hasSourceSwitch ? (
        <ReferenceSourceSelect value={state.referenceType} sources={sources} popupZIndex={popupZIndex ?? DEFAULT_POPUP_Z_INDEX}
          testId='workflow-reference-source' onChange={state.setReferenceType} />
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
              methodId={state.methodId} disabled={readOnly} autoFocus={autoFocus}
              popupZIndex={popupZIndex} onChange={state.selectMethod} />
          )}
          {responsePartAsText ? (
            <span className='bodyLegacyGeneratorResponseText bodyLegacyRadioIcon'
              title={state.responseType}>
              {RESPONSE_PART_LETTER[state.responseType]}
            </span>
          ) : (
            <ResponseTypeSelect value={state.responseType} popupZIndex={popupZIndex ?? DEFAULT_POPUP_Z_INDEX}
              disabled={readOnly} testId='workflow-reference-response-type' onChange={state.selectResponseType} />
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
            onSubmit={!applyOnSelect && !readOnly ? state.applyDirect : undefined}
          />
          {!applyOnSelect && !readOnly && (
            <Tooltip content={t('references.addReference')} zIndex={tooltipZIndex}>
            <Button
              type='text'
              className='bodyLegacyGeneratorAction'
              data-testid='workflow-reference-apply'
              icon={<PlusOutlined />}
              disabled={!state.selectedMethod || !state.field} onClick={state.applyDirect}
            />
            </Tooltip>
          )}
        </>
      ) : state.referenceType === 'global' ? (
        <>
          <GlobalVariableSelect value={state.globalName} onChange={state.setGlobalName} canPickScripts={canPickScripts}
            popupZIndex={popupZIndex} className='bodyLegacyWebhookSelect' size='large' testId='workflow-reference-global-select' />
          <Tooltip content={t('references.addReference')} zIndex={tooltipZIndex}>
            <Button
              type='text'
              className='bodyLegacyGeneratorAction'
              data-testid='workflow-reference-apply'
              icon={<PlusOutlined />}
              disabled={!state.globalName} onClick={state.applyGlobal}
            />
          </Tooltip>
        </>
      ) : (
        <>
          <LegacyWebhookReferenceSelect value={state.webhookValue} onChange={state.setWebhookValue} />
          <Tooltip content={t('references.addReference')} zIndex={tooltipZIndex}>
            <Button
              type='text'
              className='bodyLegacyGeneratorAction'
              data-testid='workflow-reference-apply'
              icon={<PlusOutlined />}
              disabled={!state.webhookValue} onClick={state.applyWebhook}
            />
          </Tooltip>
        </>
      )}
    </div>
  );
}
