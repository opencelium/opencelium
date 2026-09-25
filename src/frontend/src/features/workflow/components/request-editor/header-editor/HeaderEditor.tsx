import { useMethodContext } from '../../../providers/MethodContext';
import { LegacyRequestJsonEditor } from '../shared/LegacyRequestJsonEditor/LegacyRequestJsonEditor';

type Props = { readOnly?: boolean };

export function HeaderEditor({ readOnly }: Props) {
  const { method } = useMethodContext();

  return (
    <LegacyRequestJsonEditor
      readOnly={readOnly}
      messageProperty='header'
      source={(method.request.header || {}) as Record<string, unknown>}
    />
  );
}
