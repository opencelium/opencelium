import { useContext } from 'react';
import { TestRunContext } from './TestRunContext';

// Returns null when rendered outside a TestRunProvider (e.g. a canvas reused
// without the workflow page wiring) — consumers fall back to a static UI.
export function useTestRun() {
	return useContext(TestRunContext);
}
