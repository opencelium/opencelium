import { Dialog } from '@shared/ui/primitives/Dialog';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Alert, Button, Segmented } from 'antd';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/theme-tomorrow';
import 'ace-builds/src-noconflict/theme-tomorrow_night';
import type { WorkflowJsonDialogProps } from './WorkflowJsonDialog.types';
import { WorkflowJsonTree } from './WorkflowJsonTree';
import { useWorkflowJsonEditor, type WorkflowJsonMode } from './useWorkflowJsonEditor';
import { useConfirm } from '@shared/ui/confirm/ConfirmDialogContext';
import { useGetCategoriesQuery } from '@entities/category/api/categoryApi';
import { useGetDataAggregatorsQuery } from '@entities/dataAggregator/api/dataAggregatorApi';
import { useTheme } from '@shared/theme/hooks/useTheme';
import { useMemo, type ComponentProps } from 'react';
import type { Ace } from 'ace-builds';
import { findJsonPathPositions, findJsonSyntaxErrorPosition } from './workflowJson.locations';
import './WorkflowJsonDialog.css';
import { useFetchEntitiesQuery } from '@shared/api/genericApi';

type ConnectionMeta = { id: number; title: string };

export function WorkflowJsonDialog({ open, readOnly, value, connectors,
	onClose, onApply }: WorkflowJsonDialogProps) {
	const { t } = useI18n('workflow');
	const { themeMode } = useTheme();
	const confirm = useConfirm();
	const { data: categories } = useGetCategoriesQuery(undefined, { skip: !open });
	const { data: aggregators } = useGetDataAggregatorsQuery(undefined, { skip: !open });
	const { data: connections, isSuccess: connectionsLoaded } = useFetchEntitiesQuery(
		'/connection/all/meta', { skip: !open },
	);
	const editor = useWorkflowJsonEditor(open, value, { connectors,
		categoryIds: categories?.map((category) => category.id),
		aggregatorIds: aggregators?.map((aggregator) => aggregator.id),
		connections: Array.isArray(connections) ? connections as ConnectionMeta[] : undefined,
		connectionsLoaded });
	const error = editor.syntaxError
		? t('json.errors.syntax', { reason: editor.syntaxError })
		: editor.validation && !editor.validation.success
			? editor.validation.errors.map((item) => t(item.key, {
				path: item.path || '-', reason: item.reason || '-',
			})).join('\n') : null;
	const editorErrors = useMemo(() => {
		const annotations: Ace.Annotation[] = [];
		if (editor.syntaxError) {
			const position = findJsonSyntaxErrorPosition(editor.raw, editor.syntaxError);
			if (position) annotations.push({ ...position, type: 'error', text: editor.syntaxError });
		} else if (editor.validation && !editor.validation.success) {
			const positions = findJsonPathPositions(editor.raw);
			for (const item of editor.validation.errors) {
				if (!item.path) continue;
				const position = positions.get(item.path);
				if (position) annotations.push({ ...position, type: 'error', text: t(item.key, {
					path: item.path, reason: item.reason || '-',
				}) });
			}
		}
		return annotations;
	}, [editor.raw, editor.syntaxError, editor.validation, t]);
	const errorMarkers: NonNullable<ComponentProps<typeof AceEditor>['markers']> = editorErrors.map(({ row }) => ({
		startRow: row, endRow: row, startCol: 0, endCol: 1,
		className: 'ace_error-line', type: 'fullLine', inFront: false,
	}));
	const close = async () => {
		if (editor.dirty && !await confirm({ title: t('json.discard.title'),
			message: t('json.discard.message') })) return;
		onClose();
	};
	const apply = async () => {
		if (!editor.validation?.success) return;
		const approved = await confirm({ title: t('json.applyConfirm.title'),
			message: t('json.applyConfirm.message') });
		if (!approved) return;
		onApply(editor.validation.data);
	};
	const footer = <>
		<Button data-testid="workflow-json-cancel" onClick={() => void close()}>{t('actions.cancel')}</Button>
		{!readOnly && <>
			<Button data-testid="workflow-json-reset" disabled={!editor.dirty}
				onClick={editor.reset}>{t('json.reset')}</Button>
			<Button type="primary" data-testid="workflow-json-apply"
				disabled={!editor.dirty || !!error}
				onClick={() => void apply()}>{t('actions.apply')}</Button>
		</>}
	</>;

	return (
		<Dialog open={open} onClose={() => void close()} title={t('json.title')}
			width="94vw" top={18} maximizable testId="workflow-json-dialog" footer={footer}>
			<Segmented data-testid="workflow-json-mode-toggle" value={editor.mode}
				onChange={(mode) => editor.setMode(mode as WorkflowJsonMode)}
				options={[{ label: t('json.mode.tree'), value: 'tree' },
					{ label: t('json.mode.raw'), value: 'raw' }]} />
			{error && <Alert data-testid="workflow-json-error" type="error" showIcon
				message={<span style={{ whiteSpace: 'pre-line' }}>{error}</span>} style={{ marginTop: 12 }} />}
			{editor.mode === 'tree'
				? <WorkflowJsonTree value={editor.draft} readOnly={readOnly} onChange={editor.setTreeDraft} />
				: <div data-testid="workflow-json-raw" style={{ height: 'calc(100vh - 280px)', marginTop: 12 }}>
					<AceEditor mode="json" theme={themeMode === 'dark' ? 'tomorrow_night' : 'tomorrow'}
						name="workflow-json-raw-editor" value={editor.raw} readOnly={readOnly}
						onChange={editor.updateRaw} width="100%" height="100%" fontSize={14}
						annotations={editorErrors} markers={errorMarkers}
						showGutter highlightActiveLine={!readOnly} wrapEnabled
						setOptions={{ useWorker: false, showPrintMargin: false,
							showFoldWidgets: true, tabSize: 2 }} />
				</div>}
		</Dialog>
	);
}
