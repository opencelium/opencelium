import { useMemo } from 'react';
import type { Ace } from 'ace-builds';
import type { IMarker } from 'react-ace';
import { findJsonPathPositions, findJsonSyntaxErrorPosition } from './jsonEditor.locations';
import type { JsonEditorValidation } from './JsonEditorDialog.types';

export function useJsonEditorAnnotations<T>(raw: string, syntaxError: string | null,
	validation: JsonEditorValidation<T> | null) {
	const annotations = useMemo(() => {
		const result: Ace.Annotation[] = [];
		if (syntaxError) {
			const position = findJsonSyntaxErrorPosition(raw, syntaxError);
			if (position) result.push({ ...position, type: 'error', text: syntaxError });
		} else if (validation && !validation.success) {
			const positions = findJsonPathPositions(raw);
			for (const item of validation.errors) {
				if (!item.path) continue;
				const position = positions.get(item.path);
				if (position) result.push({ ...position, type: 'error', text: item.message });
			}
		}
		return result;
	}, [raw, syntaxError, validation]);
	const markers: IMarker[] = annotations.map(({ row }) => ({
		startRow: row, endRow: row, startCol: 0, endCol: 1,
		className: 'ace_error-line', type: 'fullLine', inFront: false,
	}));
	return { annotations, markers };
}
