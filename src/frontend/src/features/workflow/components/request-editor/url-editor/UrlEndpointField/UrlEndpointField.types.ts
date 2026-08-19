import type React from 'react';
import type { EndpointArg } from '../../../../types/connection';

export type UrlEndpointFieldProps = {
	readOnly?: boolean;
	value: string;
	beforeNode?: React.ReactNode;
	afterNode?: React.ReactNode;
	endpointArgs: Record<string, EndpointArg>;
	endpointArgsRef: React.RefObject<Record<string, EndpointArg>>;
	divRef: React.RefObject<HTMLDivElement | null>;
	lastCaretRef: React.RefObject<number>;
	lastRawCaretRef: React.RefObject<number>;
	selectedTokenIndexRef: React.RefObject<number | null>;
	onRawChange: (nextRaw: string) => void;
	onBlurCommit: () => void;
	onRawCaretChange?: (rawCaret: number, visualCaret: number) => void;
};

export type UrlEndpointRender = (raw: string, caretOverride?: number) => void;
