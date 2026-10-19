const translatedErrors = [
	'syntax',
	'nashornSyntax',
	'csp',
	'invalidResult',
	'workerError',
	'invalidArgument',
];

export function sandboxErrorKey(
	message: string,
): { key: string; options?: Record<string, string> } | undefined {
	if (message.startsWith('serverOnly:'))
		return { key: 'sandbox.serverOnly', options: { name: message.slice('serverOnly:'.length) } };
	const unavailable = message.match(/^(.*?) is not available on the server engine \(Nashorn ES5\.1\)$/);
	if (unavailable) return { key: 'sandbox.builtin', options: { name: unavailable[1] } };
	if (translatedErrors.includes(message)) return { key: `sandbox.${message}` };
	return undefined;
}
