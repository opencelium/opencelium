import { useMethodContext } from '../../../../providers/MethodContext';
import { LegacyRequestJsonEditor } from '../../shared/LegacyRequestJsonEditor/LegacyRequestJsonEditor';
import { XmlBodyEditor } from '../XmlBodyEditor/XmlBodyEditor';
import { GraphQlBodyEditor } from '../graphql/GraphQlBodyEditor';
import type { BodyEditorProps } from './BodyEditor.types';

export function BodyEditor({ readOnly }: BodyEditorProps) {
  const { method } = useMethodContext();

  if (method.request.body?.data === 'graphql') {
    // GraphiQL reads the initial query and variables only when it mounts, so another method gets a fresh editor.
    return <GraphQlBodyEditor key={method.id} readOnly={readOnly} />;
  }

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
