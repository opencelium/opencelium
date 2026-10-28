import { buildWorkflowIndexes } from '@features/workflow/api/connectionPayload.indexes';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '@features/workflow/types/workflow.types';

const MAX_FIELDS_PER_STEP = 8;
const MAX_VALUE_LENGTH = 80;
// "#FFCFB5.(response).body.$.result[i].host", alone or wrapped in {% %}.
const REFERENCE_RE = /\{?%?\s*(#[0-9A-Fa-f]{6})\.\((response|request)\)\.(body|header|status)(?:\.\$)?\.?([^%}\s"]*)\s*%?\}?/g;

const segmentsOf = (index: string) => index.split('_').map((part) => Number(part) || 0);

function compareIndex(left: string, right: string): number {
	const [a, b] = [segmentsOf(left), segmentsOf(right)];
	for (let position = 0; position < Math.max(a.length, b.length); position += 1) {
		const difference = (a[position] ?? -1) - (b[position] ?? -1);
		if (difference !== 0) return difference;
	}
	return 0;
}

/** References in readable form: `#FFCFB5.(response).body.$.result[i].host` → `Get hosts › result[i].host`. */
export function readableReferences(text: string, stepByColor: ReadonlyMap<string, string>): string {
	return text.replace(REFERENCE_RE, (_match, color: string, _direction: string, part: string, path: string) => {
		const step = stepByColor.get(color.toUpperCase()) ?? 'an earlier step';
		return part === 'body' ? `${step} › ${path || 'response'}` : `${step} › ${part}`;
	});
}

const clip = (text: string) => (text.length > MAX_VALUE_LENGTH ? `${text.slice(0, MAX_VALUE_LENGTH)}…` : text);

/** The body's filled leaves as `field = value` / `field from <step> › <path>`; empty template fields say nothing. */
function bodyFields(body: unknown, stepByColor: ReadonlyMap<string, string>): string[] {
	const fields: string[] = [];
	const visit = (value: unknown, path: string) => {
		if (Array.isArray(value)) return value.forEach((item, index) => visit(item, `${path}[${index}]`));
		if (value !== null && typeof value === 'object') {
			return Object.entries(value).forEach(([key, child]) => visit(child, path ? `${path}.${key}` : key));
		}
		const text = value === undefined || value === null ? '' : String(value).trim();
		if (!text || !path) return;
		const readable = readableReferences(text, stepByColor);
		fields.push(readable === text ? `${path} = "${clip(text)}"` : `${path} from ${clip(readable)}`);
	};
	visit(body, '');
	return fields;
}

/**
 * The workflow as indented lines for the AI: steps in tree order, nested under their loops and conditions, each with its
 * operation, system and the fields it fills. Steps are named as on the canvas, references by the step they read.
 */
export function buildWorkflowOutline(nodes: WorkflowNodeModel[], edges: WorkflowEdgeModel[]): string {
	const indexes = buildWorkflowIndexes(nodes, edges);
	const stepByColor = new Map(nodes.filter((node) => node.data.color).map((node) => [String(node.data.color).toUpperCase(), node.data.title]));
	const ordered = nodes
		.filter((node) => indexes.has(node.id) && node.type !== 'start' && node.type !== 'comment')
		.sort((left, right) => compareIndex(indexes.get(left.id) ?? '', indexes.get(right.id) ?? ''));
	return ordered.flatMap((node) => {
		const pad = '  '.repeat(segmentsOf(indexes.get(node.id) ?? '').length - 1);
		const condition = node.data.conditionConfig;
		if (condition) {
			const expression = readableReferences(condition.expression ?? '', stepByColor).replace(/^for\s+/i, '');
			return condition.operatorType === 'loop'
				? [`${pad}For each ${condition.iterator ?? 'item'} of ${expression}:`]
				: [`${pad}If ${expression}:`];
		}
		const config = node.data.methodConfig;
		const operation = config?.name ?? node.data.subtitle ?? '';
		const system = node.data.connector?.title ?? '';
		const head = `${pad}${node.data.title}${operation && operation !== node.data.title ? ` — ${operation}` : ''}${system ? ` on ${system}` : ''}`;
		const fields = config ? bodyFields(config.body, stepByColor) : [];
		const shown = fields.slice(0, MAX_FIELDS_PER_STEP).map((field) => `${pad}    sets ${field}`);
		if (fields.length > MAX_FIELDS_PER_STEP) shown.push(`${pad}    … ${fields.length - MAX_FIELDS_PER_STEP} more fields`);
		return [head, ...shown];
	}).join('\n');
}
