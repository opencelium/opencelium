import { useI18n } from '@shared/i18n/hooks/useI18n';
import { NewFeature } from '@shared/ui/feedback/NewFeature/NewFeature';
import { REFERENCE_GROUP_LABEL_KEY, type ReferencePathOptionKind } from '../requestReferenceOptions';

type Props = { kind: ReferencePathOptionKind; zIndex?: number };

export function ReferenceGroupLabel({ kind, zIndex }: Props) {
  const { t } = useI18n('workflow');
  const label = t(REFERENCE_GROUP_LABEL_KEY[kind]);
  if (kind !== 'operation') return label;
  return <NewFeature id='workflow-reference-operations' variant='pill' placement='right' zIndex={zIndex}>
    {label}
  </NewFeature>;
}
