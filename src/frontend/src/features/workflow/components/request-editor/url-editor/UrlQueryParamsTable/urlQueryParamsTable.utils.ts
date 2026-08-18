import type React from 'react';
import { ARG_TOKEN_RE, sanitizePlainTextPaste, sanitizeUrlInputValue,
	shouldBlockUrlKeyInput } from '../urlEditor.utils';

export const queryParamInputStyle: React.CSSProperties = { height: 40, fontSize: 14 };

export const preventInvalidQueryParamKey = (event: React.KeyboardEvent<HTMLInputElement>) => {
	if (shouldBlockUrlKeyInput(event.key)) event.preventDefault();
};

export const sanitizePastedQueryParam = (value: string) =>
	sanitizeUrlInputValue(sanitizePlainTextPaste(value));

export const hasArgToken = (value: string) => {
	ARG_TOKEN_RE.lastIndex = 0;
	const result = ARG_TOKEN_RE.test(value || '');
	ARG_TOKEN_RE.lastIndex = 0;
	return result;
};
