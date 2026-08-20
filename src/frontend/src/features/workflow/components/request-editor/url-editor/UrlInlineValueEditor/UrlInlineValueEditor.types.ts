import type { Connection, EndpointArg, MethodWithId } from '../../../../types/connection';

export type UrlInlineValueEditorProps = {
	value: string;
	endpointArgs: Record<string, EndpointArg>;
	readOnly?: boolean;
	/** Both only feed the paused-run hover tooltip / inspectable ring. */
	connection?: Connection | null;
	currentMethod?: MethodWithId;
	onChange: (value: string) => void;
	onCaretChange?: (rawCaret: number) => void;
};
