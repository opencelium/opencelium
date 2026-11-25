import type { ResponseType } from '../request-editor/body-editor/requestReferenceOptions';

export type ReferenceSource = 'constant' | 'direct' | 'webhook' | 'global';

/** The letter a chosen response part is shown by; also used where the part is only named. */
export const RESPONSE_PART_LETTER: Record<ResponseType, string> = { body: 'B', header: 'H', status: 'S' };
