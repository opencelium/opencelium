import type { CSSProperties } from 'react';

export interface LimitedAceEditorProps {
	maxLength?: number;
	mode?: string;
	editorTheme?: any;
	theme?: any;
	value?: string;
	fontSize?: number;
	showPrintMargin?: boolean;
	showGutter?: boolean;
	highlightActiveLine?: boolean;
	wrapEnabled?: boolean;
	setOptions?: any;
	className?: string;
	readOnly?: boolean;
	style?: CSSProperties;
	markers?: any;
	onChange?: (value: string) => void;
	name?: string;
	editorProps?: any;
	height?: string;
	width?: string;
	placeholder?: string;
	onBlur?: () => void;
	cursorStart?: any;
	focus?: boolean;
	counterStyles?: {
		top?: string;
		right?: string;
	};
	hasDiffLang?: boolean,
}

export interface LimitedAceEditorCounterProps {
	top?: string;
	right?: string;
}
