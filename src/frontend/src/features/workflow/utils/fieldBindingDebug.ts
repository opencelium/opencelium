/**
 * TEMPORARY diagnostics for the field-binding script that arrives empty in the
 * binding drawer. Off unless switched on in the browser console:
 *
 *   localStorage.setItem('oc_debug_field_bindings', '1')   // then reload
 *   localStorage.removeItem('oc_debug_field_bindings')     // off again
 *
 * Everything is logged as a *shape* — key names, types, lengths and a short
 * preview — rather than whole payloads, so a connection's bodies and headers do
 * not end up pasted into a chat. Delete this file and its three call sites
 * (normalizeFieldBinding, buildEditorConnection, BindingDrawerEditor) once the
 * script question is settled.
 */
const FLAG = 'oc_debug_field_bindings';

const isEnabled = () => {
	try {
		return localStorage.getItem(FLAG) === '1';
	} catch {
		// Private mode, blocked site data: never let diagnostics break the page.
		return false;
	}
};

const PREVIEW_LENGTH = 160;

const describeValue = (value: unknown) => {
	if (value === undefined) return 'undefined';
	if (value === null) return 'null';
	if (typeof value === 'string') {
		return `string(len=${value.length})${value ? ` ${JSON.stringify(value.slice(0, PREVIEW_LENGTH))}` : ' EMPTY'}`;
	}
	if (Array.isArray(value)) return `array(len=${value.length})`;
	if (typeof value === 'object') return `object{${Object.keys(value).join(',')}}`;
	return `${typeof value}(${String(value)})`;
};

/** The fields that decide whether an editor can show a script, and nothing else. */
export const describeEnhancement = (enhancement: unknown) => {
	if (!enhancement || typeof enhancement !== 'object') return { enhancement: describeValue(enhancement) };
	const record = enhancement as Record<string, unknown>;
	return {
		keys: Object.keys(record).join(','),
		enhanceId: describeValue(record.enhanceId),
		enhancementId: describeValue(record.enhancementId),
		language: describeValue(record.language),
		script: describeValue(record.script),
		expertCode: describeValue(record.expertCode),
		expertVar: describeValue(record.expertVar),
		simpleCode: describeValue(record.simpleCode),
		args: describeValue(record.args),
	};
};

export const describeBinding = (binding: unknown) => {
	const record = (binding ?? {}) as Record<string, unknown>;
	return {
		bindingKeys: Object.keys(record).join(','),
		id: describeValue(record.id),
		from: describeValue(record.from),
		to: describeValue(record.to),
		...describeEnhancement(record.enhancement),
	};
};

export const logFieldBinding = (stage: string, details: Record<string, unknown>) => {
	if (!isEnabled()) return;
	console.info(`[field-binding] ${stage}`, details);
};

export const isFieldBindingDebugEnabled = isEnabled;
