import type { Ace } from 'ace-builds';
import type { CompatibilityIssue } from '@features/workflow/script-sandbox/checkNashornCompatibility';
import type { Enhancement } from '../../../../types/connection';

export type EnhancementScriptProps = {
	enhancement: Enhancement;
	onChangeScript: (newScript: string) => void;
	readOnly?: boolean;
 runtimeLocation?: { line: number; column: number };
	onDraftChange?: (script: string) => void;
	onEditorReady?: (editor: Ace.Editor) => void;
	onIssuesChange?: (issues: CompatibilityIssue[]) => void;
};
