import { z } from 'zod';

const recordSchema = z.record(z.string(), z.unknown());
const connectorSchema = z.looseObject({
	connectorId: z.number(),
	title: z.string().min(1),
});
const methodSchema = z.looseObject({
	id: z.string().min(1),
	index: z.string().min(1),
	name: z.string().min(1),
	connector: connectorSchema.nullable(),
});
const operatorSchema = z.looseObject({
	id: z.string().min(1),
	index: z.string().min(1),
	type: z.enum(['if', 'loop', 'IF', 'LOOP']),
	expression: z.string(),
});
const nodeSchema = z.looseObject({
	id: z.string().min(1),
	type: z.string().min(1),
	position: z.object({ x: z.number(), y: z.number() }),
	data: recordSchema,
});
const edgeSchema = z.looseObject({
	id: z.string().min(1),
	source: z.string().min(1),
	target: z.string().min(1),
});

export const workflowJsonSchema = z.looseObject({
	connectionId: z.number().optional(),
	title: z.string().min(1),
	name: z.string().min(1),
	description: z.string(),
	categoryId: z.number().nullable(),
	fieldBinding: z.array(z.unknown()),
	fromConnector: z.looseObject({
		connectorId: z.number(),
		title: z.string().min(1),
		methods: z.array(methodSchema),
		operators: z.array(operatorSchema),
	}),
	toConnector: z.null(),
	ui: z.looseObject({
		viewport: z.object({ x: z.number(), y: z.number(), zoom: z.number() }).optional(),
		workflowNodes: z.array(nodeSchema),
		workflowEdges: z.array(edgeSchema),
	}),
});

export type WorkflowJsonPayload = z.infer<typeof workflowJsonSchema>;
