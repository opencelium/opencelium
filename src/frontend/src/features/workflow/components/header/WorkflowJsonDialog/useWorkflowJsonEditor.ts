import { useEffect, useRef, useState } from 'react';
import { validateWorkflowJson, type WorkflowJsonValidationContext } from './workflowJson.validate';

export type WorkflowJsonMode = 'tree' | 'raw';

const stringify = (value: Record<string, unknown>) => JSON.stringify(value, null, 2);

export function useWorkflowJsonEditor(open: boolean, value: Record<string, unknown>,
	validationContext?: WorkflowJsonValidationContext) {
	const sourceRef = useRef(value);
	const wasOpenRef = useRef(false);
	const [sourceText, setSourceText] = useState(() => stringify(value));
	const [draft, setDraft] = useState(value);
	const [raw, setRaw] = useState(() => stringify(value));
	const [mode, setMode] = useState<WorkflowJsonMode>('tree');
	const [syntaxError, setSyntaxError] = useState<string | null>(null);

	useEffect(() => {
		if (open && !wasOpenRef.current) {
			sourceRef.current = value;
			setSourceText(stringify(value));
			setDraft(value);
			setRaw(stringify(value));
			setMode('tree');
			setSyntaxError(null);
		}
		wasOpenRef.current = open;
	}, [open, value]);

	const setTreeDraft = (next: Record<string, unknown>) => {
		setDraft(next);
		setRaw(stringify(next));
		setSyntaxError(null);
	};
	const updateRaw = (next: string) => {
		setRaw(next);
		try {
			const parsed: unknown = JSON.parse(next);
			if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Expected an object');
			setDraft(parsed as Record<string, unknown>);
			setSyntaxError(null);
		} catch (error: unknown) {
			setSyntaxError(error instanceof Error ? error.message : String(error));
		}
	};
	const reset = () => setTreeDraft(sourceRef.current);
	const dirty = raw !== sourceText;

	const validation = syntaxError ? null : validateWorkflowJson(draft, validationContext);
	return { draft, raw, updateRaw, mode, setMode, setTreeDraft, reset, dirty,
		syntaxError, validation };
}
