export const PROHIBITED_ENDPOINT_CHARACTERS = ['<', '>', 'Enter'];
export const URL_FORBIDDEN_INPUT_RE = /[\u0000-\u001F\u007F"<>`|\\^[\]]/g;
const URL_FORBIDDEN_INPUT_SINGLE_RE = /[\u0000-\u001F\u007F"<>`|\\^[\]]/;

export const sanitizePlainTextPaste = (value: string) =>
	(value || '').replace(/\r?\n/g, '').replace(/\t/g, ' ');
export const sanitizeUrlInputValue = (value: string) =>
	(value || '').replace(URL_FORBIDDEN_INPUT_RE, '');
export const shouldBlockUrlKeyInput = (key: string) =>
	key.length === 1 && URL_FORBIDDEN_INPUT_SINGLE_RE.test(key);

export const normalizeReference = (reference: string) => {
	let value = (reference || '').trim();
	if (value.startsWith('{%') && value.endsWith('%}')) value = value.slice(2, -2).trim();
	return value.startsWith('#') ? value : `#${value}`;
};
