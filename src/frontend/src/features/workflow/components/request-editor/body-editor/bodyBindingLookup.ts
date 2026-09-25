import type { Connection } from '../../../types/connection';
import { buildRequestResultField, getParsedReferences } from './bodyReference';
import type { RequestMessageProperty } from './bodyBinding.types';

export const findRequestEnhancement = (
  connection: Connection | null,
  methodColor: string,
  namespace: string[],
  name: string,
  messageProperty: RequestMessageProperty,
  value?: unknown,
) => {
  const resultVar = `${methodColor}.(request).${buildRequestResultField(messageProperty, namespace, name)}`;
  const exact = connection?.fieldBindings.find(
    (binding) => binding.enhancement?.args?.RESULT_VAR === resultVar,
  )?.enhancement;
  if (exact) return exact;

  const refs = getParsedReferences(typeof value === 'string' ? value : '');
  if (refs.length === 0) return undefined;
  const refValues = refs.map((reference) =>
    `${reference.color}.(${reference.type}).${reference.field}`);
  const resultVarPrefix = `${methodColor}.(request).${messageProperty}.$`;
  return connection?.fieldBindings.find((binding) => {
    const args = binding.enhancement?.args || {};
    if (!String(args.RESULT_VAR || '').startsWith(resultVarPrefix)) return false;
    const varCount = Object.keys(args).filter((key) => /^VAR_\d+$/.test(key)).length;
    if (varCount !== refValues.length) return false;
    return refValues.every((refValue, index) => args[`VAR_${index}`] === refValue);
  })?.enhancement;
};
