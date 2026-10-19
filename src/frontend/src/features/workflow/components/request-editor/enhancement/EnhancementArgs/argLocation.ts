import type { ParsedArgEntry } from './EnhancementArgs.types';

const REQUEST_LOCATION_KEYS: Record<string, string> = {
	body: 'args.locations.requestBody',
	header: 'args.locations.requestHeader',
	endpoint: 'args.locations.requestUrl',
	status: 'args.locations.responseStatus',
};
const RESPONSE_LOCATION_KEYS: Record<string, string> = {
	body: 'args.locations.responseBody',
	header: 'args.locations.responseHeader',
	status: 'args.locations.responseStatus',
};

const stripRootPath = (path: string) =>
	String(path || '')
		.replace(/\.$/, '')
		.replace(/^\$\./, '')
		.replace(/^\$/, '');

/** Where a variable's value lives: an i18n key (or raw property) for the location, plus the field path. */
export function argLocation(entry: ParsedArgEntry): { locationKey: string; field: string } {
	const keys = entry.direction === 'response' ? RESPONSE_LOCATION_KEYS : REQUEST_LOCATION_KEYS;
	const strippedPath = stripRootPath(entry.path);
	const field =
		!strippedPath && ['body', 'header'].includes(entry.messageProperty)
			? `${entry.messageProperty}.$`
			: strippedPath;
	return { locationKey: keys[entry.messageProperty] || entry.messageProperty, field };
}
