import { useGlobalReferenceInfo } from '@entities/globalVariable/ui/picker/useGlobalReferenceInfo';
import type { Connection, MethodWithId } from '../../../../types/connection';
import { BodyReferenceMenu } from './BodyReferenceMenu';
import { ReferenceChip } from '../../../reference-chip/ReferenceChip';
import { GLOBAL_CHIP_COLOR } from '../../../reference-chip/referenceChip.utils';
import { useReferenceSourceLabels } from '../../../reference-chip/ReferenceSourceContext';

type Props = {
  reference: string;
  onEdit?: (reference: string) => void;
  onRemove?: () => void;
  connection?: Connection;
  currentMethod?: MethodWithId;
};

// The chip's tooltip would sit on the menu, so its details move into the menu's first row.
export function BodyGlobalReference({ reference, onEdit, onRemove, connection, currentMethod }: Props) {
  const info = useGlobalReferenceInfo(reference);
  const labels = useReferenceSourceLabels();
  return (
    <BodyReferenceMenu value={reference} title={info?.detail} onEdit={onEdit} onRemove={onRemove}
      connection={connection} currentMethod={currentMethod}>
      <ReferenceChip color={GLOBAL_CHIP_COLOR} source={labels.global} path={info?.label ?? reference}
        tone={info?.isUnknown ? 'error' : 'default'} isClickable testId='global-reference-chip' />
    </BodyReferenceMenu>
  );
}
