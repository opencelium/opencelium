import { isPlainObject, xmlAttributesOf, xmlChildEntries, xmlRootEntry } from './xmlBody';

/** Elements of a stored XML body the backend does not send as the editor shows them. */
export type XmlBackendLimits = {
	/** Attributes other than one `xmlns:prefix` declaration: the backend reads them as a namespace. */
	attributes: string[];
	/** A prefix the element does not declare itself is dropped, a root prefix with digits doubled. */
	prefixes: string[];
};

const NAMESPACE_DECLARATION_RE = /^xmlns:[^:]+$/;
const ROOT_PREFIX_KEPT_RE = /^[a-zA-Z ]+:/;

export function findXmlBackendLimits(body: unknown): XmlBackendLimits {
	const attributes = new Set<string>();
	const prefixes = new Set<string>();
	const visit = (name: string, raw: unknown, isRoot: boolean) => {
		const fields = isPlainObject(raw) ? raw : {};
		const keys = Object.keys(xmlAttributesOf(fields) ?? {});
		const declared = keys.length === 1 && NAMESPACE_DECLARATION_RE.test(keys[0]) ? keys[0].slice('xmlns:'.length) : null;
		if (keys.length && !declared) attributes.add(name);
		const separator = name.indexOf(':');
		if (separator > 0) {
			const prefix = name.slice(0, separator);
			if (prefix !== declared || (isRoot && !ROOT_PREFIX_KEPT_RE.test(name))) prefixes.add(name);
		}
		xmlChildEntries(fields).forEach(([child, value]) => visit(child, value, false));
	};
	const root = xmlRootEntry(isPlainObject(body) ? body : {});
	if (root) visit(root[0], root[1], true);
	return { attributes: [...attributes], prefixes: [...prefixes] };
}
