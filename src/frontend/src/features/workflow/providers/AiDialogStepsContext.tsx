import { createContext, useContext } from 'react';

/** Runs an AI apply inside a dialog and records it as its own history step; returns a function that forgets it. */
export type RecordAiStep = (apply: () => void) => () => void;

export const AiDialogStepsContext = createContext<RecordAiStep | null>(null);

const runUnrecorded: RecordAiStep = (apply) => {
	apply();
	return () => {};
};

/** Outside a dialog that records its AI steps (a playground, a test), the apply simply runs. */
export function useRecordAiStep(): RecordAiStep {
	return useContext(AiDialogStepsContext) ?? runUnrecorded;
}
