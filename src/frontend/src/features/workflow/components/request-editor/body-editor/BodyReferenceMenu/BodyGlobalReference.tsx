import { GlobalReferenceChip } from '@entities/globalVariable/ui/picker/GlobalReferenceChip';
import { useGlobalReferenceInfo } from '@entities/globalVariable/ui/picker/useGlobalReferenceInfo';
import type { Connection, MethodWithId } from '../../../../types/connection';
import { BodyReferenceMenu } from './BodyReferenceMenu';

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
  return (
    <BodyReferenceMenu value={reference} title={info?.detail} onEdit={onEdit} onRemove={onRemove}
      connection={connection} currentMethod={currentMethod}>
      <GlobalReferenceChip reference={reference} hasTooltip={false} />
    </BodyReferenceMenu>
  );
}
