import { ConnectorIcon } from '@entities/connector/ui/ConnectorIcon';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { LoopExample } from './LoopInfoPanel.types';

export function LoopIteratorExample({ variable, example }: {
  variable: string; example?: LoopExample;
}) {
  const { t } = useI18n('workflow');
  if (!example) return null;
  const typeLetter = example.responseType === 'header' ? 'H'
    : example.responseType === 'status' ? 'S' : 'B';
  return <>
    <div className="loopInfoHelp">{t('conditionBuilder.loopInfo.iteratorHelp')}</div>
    <div className="loopInfoExample">
      <div className="loopInfoExampleBox loopInfoExampleMethod">
        {example.hasMethod && <ConnectorIcon icon={example.connectorIcon} size={18}
          style={{ flexShrink: 0 }} />}
        <span className="loopInfoExampleText">{example.methodLabel}</span>
      </div>
      <div className="loopInfoExampleBox loopInfoExampleType">{typeLetter}</div>
      <div className="loopInfoExampleBox loopInfoExampleField">
        <span className="loopInfoExampleLoop">
          {t('references.iteratorLoop', { iterator: variable })}
        </span>
      </div>
    </div>
  </>;
}
