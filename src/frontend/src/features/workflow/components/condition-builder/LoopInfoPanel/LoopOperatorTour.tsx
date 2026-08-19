import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { LoopTour } from './LoopInfoPanel.types';

export function LoopOperatorTour({ tour }: { tour?: LoopTour }) {
  const { t } = useI18n('workflow');
  if (!tour) return null;
  return <>
    <div className="loopInfoBlock">
      <span className="loopInfoLabel">{t('conditionBuilder.loopInfo.descriptionLabel')}:</span>{' '}
      {tour.description}
    </div>
    <div className="loopInfoBlock">
      <span className="loopInfoLabel">{t('conditionBuilder.loopInfo.argumentsLabel')}:</span>
      <ul className="loopInfoList">{tour.args.map((arg) => <li key={arg.code}>
        <code className="loopInfoInlineCode">{arg.code}</code>: {arg.text}
      </li>)}</ul>
    </div>
    <div className="loopInfoBlock">
      <span className="loopInfoLabel">{t('conditionBuilder.loopInfo.examplesLabel')}:</span>
      <ul className="loopInfoList">{tour.examples.map((item) => <li key={item.code}>
        <code className="loopInfoInlineCode">{item.code}</code> → {item.result}
      </li>)}</ul>
    </div>
  </>;
}
