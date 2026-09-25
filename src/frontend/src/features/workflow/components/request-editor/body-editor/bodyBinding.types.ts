import type { ParsedReference } from './bodyReference';

export type RequestMessageProperty = 'body' | 'header';

export type DirectReferenceInfo = {
  leftField: string;
  refs: ParsedReference[];
};

export type BodyEditData = {
  namespace?: string[];
  name?: string;
  newValue?: unknown;
};
