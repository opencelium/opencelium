import { useMethodContext } from '../../../providers/MethodContext';
import { LegacyRequestJsonEditor } from '../shared/LegacyRequestJsonEditor';
import { XmlBodyEditor } from './XmlBodyEditor';

type Props = { readOnly?: boolean };

export function BodyEditor({ readOnly }: Props) {
  const { method } = useMethodContext();

  if (method.request.body?.format === 'xml') {
    return <XmlBodyEditor readOnly={readOnly} />;
  }

  return (
    <LegacyRequestJsonEditor
      readOnly={readOnly}
      messageProperty='body'
      source={(method.request.body?.fields || {}) as Record<string, unknown>}
    />
  );
}
