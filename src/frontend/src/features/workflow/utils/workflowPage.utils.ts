import type { AuthUser } from '@entities/auth/model/types';
import type { HistoryVersionItem } from '../types/history.types';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';
import { buildConnectionPayload } from '../api/connectionPayload';

export const CONNECTION_TEMPLATE_VERSION = '5.0';
export const EMPTY_NAME_LABEL = '[Empty Name]';
export const EMPTY_DESCRIPTION_LABEL = '[Empty Description]';

export const isHeaderNameEmpty = (title: string) =>
	!title.trim() || title.trim() === EMPTY_NAME_LABEL;

export const toDisplayDescription = (description?: string) =>
	description?.trim() ? description : EMPTY_DESCRIPTION_LABEL;

export const toPayloadDescription = (description?: string) =>
	description?.trim() === EMPTY_DESCRIPTION_LABEL ? '' : description ?? '';

const FIELD_BINDING_COLOR_RE = /#[A-Fa-f0-9]{6}/g;

const getFieldBindingColors = (binding: any) =>
	Object.values(binding?.enhancement?.args || {})
		.flatMap((value) => typeof value === 'string'
			? value.match(FIELD_BINDING_COLOR_RE) || [] : [])
		.map((color) => color.toLowerCase());

export const removeFieldBindingsByMethodColors = (
	fieldBindings: any[] | undefined,
	methodColors: Set<string>,
) => {
	if (!Array.isArray(fieldBindings) || methodColors.size === 0) return fieldBindings;
	return fieldBindings.filter((binding) =>
		getFieldBindingColors(binding).every((color) => !methodColors.has(color)));
};

const getProfileAuthorName = (user: AuthUser | null) => {
	const fullName = [user?.userDetail?.name, user?.userDetail?.surname]
		.map((part) => part?.trim())
		.filter(Boolean)
		.join(' ');
	return fullName || user?.username || user?.email || undefined;
};

export const applyProfileAuthor = (versions: HistoryVersionItem[], user: AuthUser | null) => {
	const profileAuthor = getProfileAuthorName(user);
	if (!profileAuthor) return versions;
	return versions.map((version) => String(version.author) === String(user?.userId)
		? { ...version, author: profileAuthor } : version);
};

// Deep key-sort so structurally equal objects stringify identically, whatever
// order the spread that produced them happened to use.
export const sortValue = (value: unknown): unknown => {
	if (Array.isArray(value)) return value.map(sortValue);
	if (!value || typeof value !== 'object') return value;
	return Object.fromEntries(Object.entries(value as Record<string, unknown>)
		.sort(([left], [right]) => left.localeCompare(right))
		.map(([key, nested]) => [key, sortValue(nested)]));
};

type SnapshotParams = {
	connectionId?: string;
	title: string;
	description: string;
	nodes: WorkflowNodeModel[];
	edges: WorkflowEdgeModel[];
	fieldBindings?: any[];
};

export const buildWorkflowChangeSnapshot = (params: SnapshotParams) =>
	JSON.stringify(sortValue(buildConnectionPayload(params)));

export const triggerJsonDownload = (filename: string, payload: unknown) => {
	const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement('a');
	anchor.href = url;
	anchor.download = filename.endsWith('.json') ? filename : `${filename}.json`;
	document.body.appendChild(anchor);
	anchor.click();
	anchor.remove();
	URL.revokeObjectURL(url);
};
