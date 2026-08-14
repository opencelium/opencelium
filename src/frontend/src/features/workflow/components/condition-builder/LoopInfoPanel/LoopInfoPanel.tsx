import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { LoopInfoPanelProps, LoopTour } from './LoopInfoPanel.types';
import { LoopOperatorTour } from './LoopOperatorTour';
import { LoopIteratorExample } from './LoopIteratorExample';

const KNOWN_OPERATORS = new Set(['for', 'forin', 'SplitString']);

export function LoopInfoPanel({ iterator, operator, example }: LoopInfoPanelProps) {
  const { t } = useI18n('workflow');
  const variable = iterator || 'i';
  const tour = operator && KNOWN_OPERATORS.has(operator)
    ? t(`conditionBuilder.loopInfo.operators.${operator}`, { returnObjects: true }) as unknown as LoopTour
    : undefined;

  return <aside className="loopInfoPanel">
    <div className="loopInfoColumns">
      <div className="loopInfoCol"><LoopOperatorTour tour={tour} /></div>
      <div className="loopInfoCol">
        <div className="loopInfoBlock">
          <span className="loopInfoLabel">{t('conditionBuilder.loopInfo.iteratorLabel')}:</span>{' '}
          {variable}
        </div>
        <LoopIteratorExample variable={variable} example={example} />
      </div>
    </div>
  </aside>;
}
