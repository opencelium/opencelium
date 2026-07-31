import type { InteractionProps } from 'react-json-view';
import { hasMixedReferenceValue } from '../body-editor/bodyReference';

export const isInvalidMixedReferenceInteraction = (payload: InteractionProps) =>
  hasMixedReferenceValue(payload.new_value) || hasMixedReferenceValue(payload.existing_value);
