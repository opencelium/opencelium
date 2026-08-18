import type { EndpointArg } from '../../../../types/connection';

export type UrlInlineValueEditorProps = {
	value: string;
	endpointArgs: Record<string, EndpointArg>;
	readOnly?: boolean;
	onChange: (value: string) => void;
	onCaretChange?: (rawCaret: number) => void;
};
