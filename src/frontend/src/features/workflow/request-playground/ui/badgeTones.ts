import type { InputValueSource } from '../model/playgroundValues';
import type { RowOrigin } from '../model/requestEdits';
import type { BadgeTone } from './PlaygroundBadge';

export const ORIGIN_TONE: Record<RowOrigin, BadgeTone> = {
	fixed: 'neutral',
	dynamic: 'primary',
	connection: 'neutral',
	secret: 'warning',
	editable: 'success',
};

export const SOURCE_TONE: Record<InputValueSource, BadgeTone> = {
	testRun: 'success',
	execution: 'primary',
	notExecuted: 'warning',
	lastTest: 'primary',
	sample: 'neutral',
	edited: 'info',
	empty: 'danger',
};
