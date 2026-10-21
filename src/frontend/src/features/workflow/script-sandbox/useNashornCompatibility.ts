import { useEffect, useState } from 'react';
import { checkNashornCompatibility, type CompatibilityIssue } from './checkNashornCompatibility';

const emptyIssues: CompatibilityIssue[] = [];
export function useNashornCompatibility(script: string, language: string) {
	const [checked, setChecked] = useState({ script, issues: emptyIssues });
	useEffect(() => {
		if (language !== 'js') return;
		const timer = setTimeout(() => setChecked({ script, issues: checkNashornCompatibility(script) }), 300);
		return () => clearTimeout(timer);
	}, [script, language]);
	return language === 'js' && checked.script === script ? checked.issues : emptyIssues;
}
