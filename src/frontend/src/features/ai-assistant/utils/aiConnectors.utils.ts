import type { Connector } from '@entities/connector/model/types';
import type { WorkflowNodeModel } from '@features/workflow/types/workflow.types';

export type AiConnectorChoice = {
	connectorId: number;
	title: string;
	icon: unknown;
	invokerName: string;
};

export type AiConnectorPair = {
	fromId: number | null;
	toId: number | null;
};

export function toConnectorChoices(connectors: Connector[]): AiConnectorChoice[] {
	return connectors
		.filter((connector) => Boolean(connector.invoker?.name))
		.map((connector) => ({
			connectorId: connector.connectorId,
			title: connector.title,
			icon: connector.icon,
			invokerName: connector.invoker.name,
		}));
}

/** The first two distinct connectors already on the canvas, in node order. */
export function pickDefaultConnectors(nodes: WorkflowNodeModel[], choices: AiConnectorChoice[]): AiConnectorPair {
	const available = new Set(choices.map((choice) => choice.connectorId));
	const onCanvas: number[] = [];
	for (const node of nodes) {
		const connectorId = node.data.connector?.connectorId;
		if (connectorId !== undefined && available.has(connectorId) && !onCanvas.includes(connectorId)) {
			onCanvas.push(connectorId);
		}
	}
	return { fromId: onCanvas[0] ?? null, toId: onCanvas[1] ?? null };
}
