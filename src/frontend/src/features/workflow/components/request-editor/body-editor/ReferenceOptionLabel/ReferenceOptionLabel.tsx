import { useI18n } from '@shared/i18n/hooks/useI18n';
import { isListReferencePath } from '../requestReferenceOptions';
import './referenceOptionLabel.css';

type ReferenceOptionLabelProps = { label: string; value: string };

export function ReferenceOptionLabel({ label, value }: ReferenceOptionLabelProps) {
  const { t } = useI18n('workflow');
  if (!isListReferencePath(value)) return <>{label}</>;
  return (
    <span className='referenceOptionLabel'>
      <span className='referenceOptionLabelText'>{label}</span>
      <span className='referenceListBadge' title={t('references.listResultHint')}>
        {t('references.listResult')}
      </span>
    </span>
  );
}
