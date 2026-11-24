import type { InteractionProps } from 'react-json-view';
import { parseGlobalReference } from '@entities/globalVariable/lib/globalReference';
import { getParsedReferences, hasMixedReferenceValue, splitReferences } from '../body-editor/bodyReference';

export const isInvalidMixedReferenceInteraction = (payload: InteractionProps) =>
  hasMixedReferenceValue(payload.new_value) || hasMixedReferenceValue(payload.existing_value);

// A script variable is only valid as an enhancement arg, which a field gets from a method reference
// next to it; on its own the field is plain text, where a run refuses a script.
export const hasLoneScriptReference = (value: unknown, scriptNames: ReadonlySet<string>) => {
  if (typeof value !== 'string' || scriptNames.size === 0 || getParsedReferences(value).length > 0) return false;
  return splitReferences(value).some((item) => {
    const parsed = parseGlobalReference(item);
    return parsed !== null && scriptNames.has(parsed.name);
  });
};
