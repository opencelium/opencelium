import type { Enhancement, FieldBinding, MethodWithId } from '../../types/connection';
import { collectEnhancementsFromObject } from './body-editor/bodyBinding';

export const collectLegacyFieldBindings = (methods: MethodWithId[]): FieldBinding[] => {
  const seen = new Map<string, Enhancement>();
  methods.forEach((method) => {
    collectEnhancementsFromObject(method.request.body?.fields || {}, method.color, 'body')
      .forEach((enhancement) => seen.set(enhancement.enhanceId, enhancement));
    collectEnhancementsFromObject(method.request.header || {}, method.color, 'header')
      .forEach((enhancement) => seen.set(enhancement.enhanceId, enhancement));
  });
  return Array.from(seen.values()).map((enhancement) => ({ enhancement }));
};
