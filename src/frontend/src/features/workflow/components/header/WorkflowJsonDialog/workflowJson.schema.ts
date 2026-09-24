import { z } from 'zod';

const hexColorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Expected a 6-digit hex color');
const httpMethodSchema = z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']);
const positiveIdSchema = z.number().int().positive();
const optionalAggregatorSchema = positiveIdSchema.nullable();
const headerSchema = z.record(z.string().min(1), z.string()).superRefine((headers, context) => {
	for (const [key, value] of Object.entries(headers)) {
		if (/\r|\n/.test(key) || /\r|\n/.test(value)) context.addIssue({
			code: 'custom', path: [key], message: 'Header names and values cannot contain line breaks',
		});
	}
});
const jsonValueSchema: z.ZodType<unknown> = z.lazy(() => z.union([
	z.string(), z.number(), z.boolean(), z.null(),
	z.array(jsonValueSchema), z.record(z.string(), jsonValueSchema),
]));
const stringRecordSchema = z.record(z.string(), z.string());
const payloadDataSchema = z.strictObject({
	type: z.enum(['object', 'array', 'string']),
	format: z.enum(['json', 'xml', 'x-www-form-urlencoded']),
	data: z.enum(['raw', 'graphql']), fields: jsonValueSchema,
});
const methodResponseSchema = z.strictObject({
	id: z.string().nullable().optional(),
	status: z.string().regex(/^[1-5]\d{2}$/, 'Expected an HTTP status code from 100 to 599'),
	header: headerSchema.nullable(), body: payloadDataSchema.nullable(),
});
const responseSchema = z.strictObject({
	responseId: z.string().optional(), success: methodResponseSchema, fail: methodResponseSchema,
});
const requestSchema = z.strictObject({
	endpoint: z.string().trim().min(1), method: httpMethodSchema, header: headerSchema,
	body: payloadDataSchema,
});
const connectorSchema = z.strictObject({
	connectorId: positiveIdSchema, title: z.string().min(1), icon: z.string().nullable(),
	invoker: z.string().nullable(),
});
const methodSchema = z.strictObject({
	id: z.string().min(1), index: z.string().min(1), name: z.string().min(1),
	label: z.string().nullable().optional(),
	methodType: z.enum(['CONNECTOR', 'HTTP_REQUEST', 'WEBHOOK']),
	dataAggregator: optionalAggregatorSchema, color: hexColorSchema,
	jump: z.string().min(1).optional(),
	connector: connectorSchema.nullable(), request: requestSchema, response: responseSchema,
});
const operatorTypeSchema = z.preprocess(
	(value) => typeof value === 'string' ? value.toLowerCase() : value,
	z.enum(['if', 'loop']),
);
const operatorSchema = z.strictObject({
	id: z.string().min(1), index: z.string().min(1),
	type: operatorTypeSchema, dataAggregator: optionalAggregatorSchema,
	expression: z.string().trim().min(1), iterator: z.string().trim().min(1).optional(),
});

const referenceSchema = z.strictObject({
	color: hexColorSchema, type: z.enum(['request', 'response']), field: z.string().min(1),
});
const backendEnhancementSchema = z.strictObject({
	enhancementId: z.number().optional(), name: z.string(), description: z.string(),
	language: z.enum(['js', 'python3', 'ruby']), simpleCode: z.string().nullable(),
	expertVar: z.string(), expertCode: z.string(),
});
const editorEnhancementSchema = z.strictObject({
	enhanceId: z.string(), description: z.string().optional(),
	language: z.enum(['js', 'python3', 'ruby']), script: z.string(), args: stringRecordSchema,
});
const fieldBindingSchema = z.strictObject({
	id: z.union([z.string(), z.number()]).optional(), from: z.array(referenceSchema).optional(),
	to: z.array(referenceSchema).optional(),
	enhancement: z.union([backendEnhancementSchema, editorEnhancementSchema]).optional(),
});

const queryParamSchema = z.strictObject({
	id: z.string().min(1), key: z.string(), value: z.string(), enabled: z.boolean(),
	autoEncode: z.boolean().optional(), argId: z.string().optional(),
});
const uiConnectorSchema = z.strictObject({
	connectorId: positiveIdSchema, title: z.string(), icon: z.string().nullable().optional(),
	invokerName: z.string().nullable().optional(), status: z.string().optional(),
	lastTestError: z.string().nullable().optional(), lastCheckedAt: z.number().nullable().optional(),
});
const uiMethodConfigSchema = z.strictObject({
	name: z.string().optional(), url: z.string(), method: httpMethodSchema.optional(),
	headers: headerSchema, queryParams: z.array(queryParamSchema).optional(),
	bodyFormat: z.enum(['json', 'xml', 'x-www-form-urlencoded']),
	bodyData: z.enum(['raw', 'graphql']), body: jsonValueSchema, response: responseSchema.optional(),
});
const conditionRuleSchema = z.strictObject({
	id: z.string(), type: z.literal('rule'), error: z.string().optional(),
	properties: z.strictObject({
		leftField: z.string().optional(), operator: z.string().optional(),
		rightField: z.string().optional(),
	}),
});
type ConditionNode = z.infer<typeof conditionRuleSchema> | {
	id: string; type: 'group'; error?: string;
	properties: { conjunction?: '&&' | '||'; not?: boolean }; items?: ConditionNode[];
};
const conditionNodeSchema: z.ZodType<ConditionNode> = z.lazy(() => z.union([
	conditionRuleSchema,
	z.strictObject({
		id: z.string(), type: z.literal('group'), error: z.string().optional(),
		properties: z.strictObject({
			conjunction: z.enum(['&&', '||']).optional(), not: z.boolean().optional(),
		}),
		items: z.array(conditionNodeSchema).optional(),
	}),
]));
const conditionConfigSchema = z.strictObject({
	operatorType: z.enum(['if', 'loop']), tree: conditionNodeSchema,
	expression: z.string().trim().min(1), iterator: z.string().trim().min(1).optional(),
});
const commentSchema = z.strictObject({
	text: z.string(), anchorNodeId: z.string(),
	offset: z.strictObject({ x: z.number(), y: z.number() }), collapsed: z.boolean().optional(),
});
const nodeDataSchema = z.strictObject({
	title: z.string(), subtitle: z.string().optional(),
	kind: z.enum(['start', 'connector', 'system', 'trigger-connection', 'if', 'loop', 'comment']),
	connector: uiConnectorSchema.optional(), methodConfig: uiMethodConfigSchema.optional(),
	conditionConfig: conditionConfigSchema.optional(), comment: commentSchema.optional(),
	dataAggregator: optionalAggregatorSchema.optional(),
});
const nodeSchema = z.strictObject({
	id: z.string().min(1),
	type: z.enum(['start', 'connector', 'system', 'trigger-connection', 'if', 'loop', 'comment']),
	position: z.strictObject({ x: z.number(), y: z.number() }),
	width: z.number().positive().optional(), height: z.number().positive().optional(),
	index: z.string().optional(),
	data: nodeDataSchema, draggable: z.boolean().optional(), deletable: z.boolean().optional(),
});
const edgeDataSchema = z.strictObject({
	branch: z.enum(['true', 'false']).optional(), highlighted: z.boolean().optional(),
	dropTarget: z.boolean().optional(), dropInvalid: z.boolean().optional(),
	dragGhost: z.boolean().optional(), dropPlaceholder: z.boolean().optional(),
});
const edgeMarkerSchema = z.union([
	z.string(),
	z.strictObject({
		type: z.enum(['arrow', 'arrowclosed']), color: z.string().nullable().optional(),
		width: z.number().positive().optional(), height: z.number().positive().optional(),
		markerUnits: z.string().optional(), orient: z.string().optional(),
		strokeWidth: z.number().optional(),
	}),
]);
const edgeSchema = z.strictObject({
	id: z.string().min(1), source: z.string().min(1), target: z.string().min(1),
	sourceHandle: z.string().nullable().optional(), targetHandle: z.string().nullable().optional(),
	type: z.literal('workflow-edge').optional(), data: edgeDataSchema.optional(),
	markerStart: edgeMarkerSchema.optional(), markerEnd: edgeMarkerSchema.optional(),
});
const flowchartSchema = z.strictObject({ flowId: z.string(), x: z.number(), y: z.number() });
const flowchartEdgeSchema = z.strictObject({
	id: z.string(), source: z.string(), target: z.string(),
	sourceHandle: z.string().nullable().optional(), targetHandle: z.string().nullable().optional(),
});

export const workflowJsonSchema = z.strictObject({
	connectionId: positiveIdSchema.optional(), title: z.string().min(1), name: z.string().min(1),
	description: z.string(), categoryId: positiveIdSchema.nullable(),
	fieldBinding: z.array(fieldBindingSchema),
	fromConnector: z.strictObject({
		connectorId: z.number(), title: z.string().min(1),
		methods: z.array(methodSchema), operators: z.array(operatorSchema),
	}),
	toConnector: z.null(),
	ui: z.strictObject({
		viewport: z.strictObject({ x: z.number(), y: z.number(),
			zoom: z.number().positive() }).optional(),
		workflowNodes: z.array(nodeSchema), workflowEdges: z.array(edgeSchema),
		flowcharts: z.array(flowchartSchema).optional(),
		flowchartEdges: z.array(flowchartEdgeSchema).optional(),
	}),
});

export type WorkflowJsonPayload = z.infer<typeof workflowJsonSchema>;
