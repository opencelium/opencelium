import type { WorkflowNodeModel } from '../types/workflow.types';
import type { InvalidReference } from './graph.dragDrop.types';
import { removeConditionReferenceColors } from './graph.conditionReferenceCleanup';
import {
  collectReferenceColors,
  normalizeReferenceColor,
} from './graph.referenceColors';
import { removeNodeDataReferenceColors } from './graph.referenceCleanup';
import { dropEnhancementArgs, hasEnhancementArgs } from './enhancementArgs';
import { isDirectReferenceEnhancement } from '../components/request-editor/body-editor/bodyReference';

const cloneValue = <T,>(value: T): T =>
  value === undefined ? value : JSON.parse(JSON.stringify(value));

export const cleanInvalidWorkflowReferences = (
  nodes: WorkflowNodeModel[],
  invalidReferences: InvalidReference[],
  fieldBindings?: any[],
) => {
  const invalidByNode = new Map<string, Set<string>>();
  invalidReferences.forEach((reference) => {
    invalidByNode.set(reference.consumerNodeId, new Set([
      ...(invalidByNode.get(reference.consumerNodeId) ?? []),
      reference.sourceColor,
    ]));
  });
  const invalidByConsumerColor = new Map<string, Set<string>>();
  nodes.forEach((node) => {
    const colors = invalidByNode.get(node.id);
    const consumerColor = normalizeReferenceColor(node.data.color);
    if (colors && consumerColor) invalidByConsumerColor.set(consumerColor, colors);
  });

  const cleanBinding = (binding: any) => {
    const resultColors = collectReferenceColors(binding?.enhancement?.args?.RESULT_VAR ?? '');
    const consumerColor = [...resultColors][0]
      ?? (Array.isArray(binding?.to) ? normalizeReferenceColor(binding.to[0]?.color) : '');
    const invalidColors = consumerColor ? invalidByConsumerColor.get(consumerColor) : undefined;
    if (!invalidColors) return binding;

    const next = cloneValue(binding);
    // A script that loses an input must say so: the dead VAR_n is dropped and
    // every use of it in the script becomes VARIABLE_NOT_EXIST, the same thing
    // deleting the variable by hand does (see Reference). Filtering the argument
    // out on its own left the script naming a variable nothing passes any more.
    const wasPassthrough = isDirectReferenceEnhancement(next?.enhancement);
    if (next?.enhancement?.args && typeof next.enhancement.args === 'object') {
      const deadArgs = Object.entries(next.enhancement.args)
        .filter(([key, value]) => key !== 'RESULT_VAR'
          && [...collectReferenceColors(value)].some((color) => invalidColors.has(color)))
        .map(([key]) => key);
      next.enhancement = dropEnhancementArgs(next.enhancement, deadArgs);
    }
    if (Array.isArray(next?.from)) {
      next.from = next.from
        .filter((item: any) => !invalidColors.has(normalizeReferenceColor(item?.color)));
    }
    if (typeof next?.enhancement?.expertVar === 'string') {
      next.enhancement.expertVar = next.enhancement.expertVar
        .split('\n')
        .filter((line: string) => ![...collectReferenceColors(line)]
          .some((color) => invalidColors.has(color)))
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
      const colors = invalidByNode.get(node.id);
      if (!colors) return node;
      if (node.type === 'if' || node.type === 'loop') {
        return {
          ...node,
          data: {
            ...node.data,
            conditionConfig: removeConditionReferenceColors(node.data.conditionConfig, colors),
          },
        };
      }
      return { ...node, data: removeNodeDataReferenceColors(node.data, colors) };
    }),
    fieldBindings: Array.isArray(fieldBindings)
      ? fieldBindings.map(cleanBinding).filter(Boolean)
      : fieldBindings,
  };
};
