import { useEffect, useState } from 'react';
import { checkNashornCompatibility } from './checkNashornCompatibility';
import { validateScript } from './langCodeApi';
import type { ScriptValidationResponse } from './langCode.types';
import type { CompatibilityIssue } from './sandbox.types';

const DEBOUNCE_MS = 500;
const emptyIssues: CompatibilityIssue[] = [];

const toSyntaxIssues = (response: ScriptValidationResponse | null): CompatibilityIssue[] =>
	response && !response.valid
		? response.errors.map((error) => ({
				kind: 'syntax',
				hint: error.hint,
				message: error.message,
				line: error.line ?? 1,
				column: error.column ? error.column - 1 : 0,
			}))
		: [];

/**
 * Syntax comes from the backend compile step (the same one a run uses); the
 * browser only adds lint warnings for code that compiles but fails on Nashorn.
 * `isChecked` is false while the latest script has not been checked yet.
 */
export function useNashornCompatibility(script: string, language: string) {
	const isJs = language === 'js';
	const [checked, setChecked] = useState<{ script: string; issues: CompatibilityIssue[] } | null>(
		null,
	);
	useEffect(() => {
		if (!isJs) return;
		let isCurrent = true;
		const timer = setTimeout(() => {
			const lint = checkNashornCompatibility(script);
			if (!script.trim()) {
				setChecked({ script, issues: lint });
				return;
			}
			void validateScript(script).then((response) => {
				if (isCurrent) setChecked({ script, issues: [...toSyntaxIssues(response), ...lint] });
			});
		}, DEBOUNCE_MS);
		return () => {
			isCurrent = false;
			clearTimeout(timer);
		};
	}, [script, isJs]);
	const isChecked = isJs && checked?.script === script;
	return { issues: isChecked ? checked.issues : emptyIssues, isChecked };
}
