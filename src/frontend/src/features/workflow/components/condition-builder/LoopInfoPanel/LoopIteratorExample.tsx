import { useI18n } from '@shared/i18n/hooks/useI18n';
import { ReferenceChip } from '@shared/ui/reference-chip/ReferenceChip';
import type { LoopExample } from './LoopInfoPanel.types';

export function LoopIteratorExample({ variable, example }: {
  variable: string; example?: LoopExample;
}) {
  const { t } = useI18n('workflow');
  if (!example) return null;
  const path = example.responseType === 'header' ? `header[${variable}]` : `[${variable}]`;
  return <>
    <div className="loopInfoHelp">{t('conditionBuilder.loopInfo.iteratorHelp')}</div>
    <div className="loopInfoExample">
      <ReferenceChip color={example.methodColor ?? 'var(--color-text-disabled)'} source={example.methodLabel}
        path={path} title={t('references.iteratorLoop', { iterator: variable })} testId='workflow-loop-iterator-example' />
    </div>
  </>;
}
