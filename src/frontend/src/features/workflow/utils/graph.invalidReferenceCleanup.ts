import type { WorkflowNodeModel } from '../types/workflow.types';
import type { InvalidReference } from './graph.dragDrop.types';
import { removeConditionReferences } from './graph.conditionReferenceCleanup';
import {
  buildReferenceMatcher,
  collectReferenceColors,
  normalizeReferenceColor,
  type ReferenceMatcher,
} from './graph.referenceColors';
import { removeNodeDataReferences } from './graph.referenceCleanup';
import { dropEnhancementArgs, hasEnhancementArgs } from './enhancementArgs';
import { isDirectReferenceEnhancement } from '../components/request-editor/body-editor/bodyReference';

const cloneValue = <T,>(value: T): T =>
  value === undefined ? value : JSON.parse(JSON.stringify(value));

export const cleanInvalidWorkflowReferences = (
  nodes: WorkflowNodeModel[],
  invalidReferences: InvalidReference[],
  fieldBindings?: any[],
) => {
  const referencesByNode = new Map<string, InvalidReference[]>();
  invalidReferences.forEach((reference) => referencesByNode.set(reference.consumerNodeId,
    [...(referencesByNode.get(reference.consumerNodeId) ?? []), reference]));
  const matcherByNode = new Map([...referencesByNode]
    .map(([nodeId, references]) => [nodeId, buildReferenceMatcher(references)]));
  const matcherByConsumerColor = new Map<string, ReferenceMatcher>();
  nodes.forEach((node) => {
    const matcher = matcherByNode.get(node.id);
    const consumerColor = normalizeReferenceColor(node.data.color);
    if (matcher && consumerColor) matcherByConsumerColor.set(consumerColor, matcher);
  });
  // A `from` entry is a reference split into parts; rejoin it so it is matched
  // exactly like the same reference written into a field.
  const fromReference = (item: { color?: string; type?: string; field?: string } | undefined) =>
    `${normalizeReferenceColor(item?.color)}.(${item?.type === 'request' ? 'request' : 'response'}).${item?.field ?? ''}`;

  const cleanBinding = (binding: any) => {
    const resultColors = collectReferenceColors(binding?.enhancement?.args?.RESULT_VAR ?? '');
    const consumerColor = [...resultColors][0]
      ?? (Array.isArray(binding?.to) ? normalizeReferenceColor(binding.to[0]?.color) : '');
    const matches = consumerColor ? matcherByConsumerColor.get(consumerColor) : undefined;
    if (!matches) return binding;

    const next = cloneValue(binding);
    // A script that loses an input must say so: the dead VAR_n is dropped and
    // every use of it in the script becomes VARIABLE_NOT_EXIST, the same thing
    // deleting the variable by hand does (see Reference). Filtering the argument
    // out on its own left the script naming a variable nothing passes any more.
    const wasPassthrough = isDirectReferenceEnhancement(next?.enhancement);
    if (next?.enhancement?.args && typeof next.enhancement.args === 'object') {
      const deadArgs = Object.entries(next.enhancement.args)
        .filter(([key, value]) => key !== 'RESULT_VAR' && matches(value))
        .map(([key]) => key);
      next.enhancement = dropEnhancementArgs(next.enhancement, deadArgs);
    }
    if (Array.isArray(next?.from)) {
      next.from = next.from
        .filter((item: any) => !matches(fromReference(item)));
    }
    if (typeof next?.enhancement?.expertVar === 'string') {
      next.enhancement.expertVar = next.enhancement.expertVar
        .split('\n')
        .filter((line: string) => !matches(line))
        .join('\n');
    }

    if (hasEnhancementArgs(next?.enhancement ?? { args: {} })) return next;
    if (Array.isArray(next?.from) && next.from.length > 0) return next;
    // Nothing left to compute from. A passthrough enhancement only ever mirrored
    // the reference in the field's own value — which this pass has just cleared —
    // so it goes with it; an authored script stays, carrying VARIABLE_NOT_EXIST
    // where its input was, because discarding someone's script silently is how
    // this breakage became invisible in the first place.
    return wasPassthrough ? null : next;
  };

  return {
    nodes: nodes.map((node) => {
      const matches = matcherByNode.get(node.id);
      if (!matches) return node;
      if (node.type === 'if' || node.type === 'loop') {
        return {
          ...node,
          data: {
            ...node.data,
            conditionConfig: removeConditionReferences(node.data.conditionConfig, matches),
          },
        };
      }
      return { ...node, data: removeNodeDataReferences(node.data, matches) };
    }),
    fieldBindings: Array.isArray(fieldBindings)
      ? fieldBindings.map(cleanBinding).filter(Boolean)
      : fieldBindings,
  };
};
