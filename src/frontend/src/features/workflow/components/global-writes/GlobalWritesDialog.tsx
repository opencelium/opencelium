import { useMemo, useState } from 'react';
import { Dialog } from '@shared/ui/primitives/Dialog';
import { Button } from '@shared/ui/primitives/Button';
import { Hint } from '@shared/ui/primitives/Hint';
import { Typography } from '@shared/ui/primitives/Typography';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { Connection } from '../../types/connection';
import type { WorkflowEdgeModel, WorkflowGlobalWrites, WorkflowNodeModel } from '../../types/workflow.types';
import { buildNodeBackedMethods, getPreviousIterators, getSourceMethods } from '../condition-builder/conditionBuilderDialog.utils';
import { GlobalWriteRowEditor } from './GlobalWriteRowEditor';
import { isRowIncomplete, newRowKey, toGlobalWrites, toRows, type GlobalWriteRow } from './globalWrites.utils';
import '../request-editor/body-editor/bodyLegacy.css';
import '../condition-builder/conditionBuilder.css';
import './globalWrites.css';

type Props = {
	open: boolean;
	node: WorkflowNodeModel | null;
	nodes: WorkflowNodeModel[];
	edges: WorkflowEdgeModel[];
	connection: Connection;
	isReadOnly: boolean;
	onClose: () => void;
	onSave: (nodeId: string, writes: WorkflowGlobalWrites) => void;
};

export function GlobalWritesDialog({ open, node, ...rest }: Props) {
	if (!open || !node) return null;
	// Keyed by node so each opening starts from that method's saved writes.
	return <GlobalWritesDialogContent key={node.id} node={node} {...rest} />;
}

function GlobalWritesDialogContent({ node, nodes, edges, connection, isReadOnly, onClose, onSave }: Omit<Props, 'open' | 'node'> & {
	node: WorkflowNodeModel;
}) {
	const { t } = useI18n('workflow');
	const [rows, setRows] = useState<GlobalWriteRow[]>(() => toRows(node.data.globalWrites));
	// The writes run once this method has responded, so its own response is a source too.
	const methods = useMemo(() => {
		const upstream = getSourceMethods(connection, nodes, edges, node);
		const own = connection.fromConnector.method.find((method) => method.id === node.id);
		return own && !upstream.includes(own) ? [...upstream, own] : upstream;
	}, [connection, edges, node, nodes]);
	const allMethods = useMemo(() => buildNodeBackedMethods(connection.fromConnector.method, nodes),
		[connection.fromConnector.method, nodes]);
	const iterators = useMemo(() => getPreviousIterators(connection, node), [connection, node]);
	const hasIncomplete = rows.some(isRowIncomplete);
	const update = (key: string, row: GlobalWriteRow) => setRows((current) => current.map((item) => item.key === key ? row : item));

	return (
		<Dialog
			open
			onClose={onClose}
			title={t('globalWrites.dialogTitle', { method: node.data.subtitle ?? node.data.title })}
			width={880}
			top={18}
			testId="workflow-global-writes-dialog"
			footer={isReadOnly ? null : (
				<Button type="primary" disabled={hasIncomplete} testId="workflow-global-writes-save"
					onClick={() => { onSave(node.id, toGlobalWrites(rows)); onClose(); }}>
					{t('globalWrites.save')}
				</Button>
			)}
		>
			<div className="globalWrites">
				<Hint noPrefix>{t('globalWrites.hint')}</Hint>
				{rows.length > 0 && (
					<div className="globalWriteRow globalWriteHeader">
						<Typography variant="label" isSubtle>{t('globalWrites.variable')}</Typography>
						<Typography variant="label" isSubtle>{t('globalWrites.value')}</Typography>
					</div>
				)}
				{rows.map((row) => (
					<GlobalWriteRowEditor key={row.key} row={row} isReadOnly={isReadOnly}
						takenVariables={rows.flatMap((item) => item.key !== row.key && item.variable ? [item.variable] : [])}
						methods={methods} allMethods={allMethods} iterators={iterators}
						onChange={(next) => update(row.key, next)}
						onRemove={() => setRows((current) => current.filter((item) => item.key !== row.key))} />
				))}
				{rows.length === 0 && <Typography variant="body" isSubtle>{t('globalWrites.empty')}</Typography>}
				{!isReadOnly && (
					<div>
						<Button iconLeft="plus" testId="workflow-global-writes-add"
							onClick={() => setRows((current) => [...current, { key: newRowKey(), value: '' }])}>
							{t('globalWrites.add')}
						</Button>
					</div>
				)}
			</div>
		</Dialog>
	);
}
