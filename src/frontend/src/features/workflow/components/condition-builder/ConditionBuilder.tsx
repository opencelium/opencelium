import {
	ApiOutlined,
	CopyOutlined,
	DownOutlined,
	LinkOutlined,
	NumberOutlined,
} from '@ant-design/icons';
import { Button, Input, Modal, Select } from 'antd';
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import type { Connection, MethodWithId } from '../../types/connection';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../../types/workflow.types';
import { LegacyResponseFieldSelect } from '../request-editor/body-editor/LegacyResponseFieldSelect/LegacyResponseFieldSelect';
import { LegacyWebhookReferenceSelect } from '../request-editor/body-editor/LegacyWebhookReferenceSelect/LegacyWebhookReferenceSelect';
import {
	buildReferenceValue,
	getMethodConnectorChipInfo,
	getMethodConnectorIcon,
	ITERATOR_NAMES,
	type ResponseType,
} from '../request-editor/body-editor/requestReferenceOptions';
import { extractWebhookValue, webhookSnippet } from '../request-editor/body-editor/bodyWebhook';
import { MethodConnectorChip } from '../request-editor/body-editor/MethodConnectorChip/MethodConnectorChip';
import {
	IF_OPERATOR_LABEL_KEYS,
	IfOperatorName,
	LOOP_OPERATOR_LABEL_KEYS,
	LoopOperatorName,
	UNARY_IF_OPERATORS,
	Conjunction,
	type ConditionConfig,
	type ConditionGroup,
	type ConditionRule,
	type ConditionRuleProperties,
	type ConditionValueSource,
} from './conditionBuilder.types';
import {
	appendChildToGroup,
	buildConditionConfig,
	createEmptyGroup,
	createEmptyRule,
	duplicateRuleById,
	getInitialTreeFromConfig,
	getMethodLabel,
	getSourceFromField,
	parseConditionOperand,
	parseMethodFromReference,
	parsePathFromReference,
	parseResponseTypeFromReference,
	removeChildById,
	updateGroupConjunction,
	updateRuleProperties,
	validateConditionTreeWithErrors,
} from './conditionBuilder.utils';
import { evaluateIfComparison, type ComparisonEvaluation, type OperandInput } from './conditionComparison';
import { LoopInfoPanel } from './LoopInfoPanel/LoopInfoPanel';
import { Radio } from '@shared/ui/primitives/Radio';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { Loading } from '@shared/ui/primitives/Loading/Loading';
import { CopyButton } from '@shared/ui/actions/CopyButton';
import { DeleteIconButton } from '@shared/ui/actions/DeleteIconButton';
import { MethodColorDot } from '../MethodColorDot/MethodColorDot';
import { getDuplicateMethodIndexByColor } from '../../utils/methodColor';
import { formatLiveReferenceValue, LIVE_INSPECTABLE_CLASS, useLiveReferenceValue } from '../request-editor/utils/useLiveReferenceValue';
import { LiveReferenceValuePreview } from '../request-editor/utils/LiveReferenceValuePreview';
import { LiveInspectHint } from '../request-editor/utils/LiveInspectHint';
import { useTestRun } from '../../test-run/useTestRun';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import '../request-editor/body-editor/bodyLegacy.css';
import '../dialogHeader.css';
import './conditionBuilder.css';

type Props = {
	open: boolean;
	node: WorkflowNodeModel | null;
	nodes: WorkflowNodeModel[];
	edges: WorkflowEdgeModel[];
	connection: Connection;
	/** Stacking, for a host that is itself a dialog — the delete dialog opens
	 *  this one over its own confirm at 20000. Left to antd's default
	 *  otherwise, which is what every other caller wants. */
	zIndex?: number;
	onClose: () => void;
	onSave: (nodeId: string, config: ConditionConfig) => void;
};

const SOURCE_OPTIONS: { value: ConditionValueSource; titleKey: string; icon: ReactNode }[] = [
	{ value: 'constant', titleKey: 'conditionBuilder.source.constant', icon: <NumberOutlined /> },
	{ value: 'direct', titleKey: 'conditionBuilder.source.method', icon: <ApiOutlined /> },
	{ value: 'webhook', titleKey: 'conditionBuilder.source.webhook', icon: <LinkOutlined /> },
];

const RESPONSE_TYPE_OPTIONS: { value: ResponseType; label: string; titleKey: string }[] = [
	{ value: 'body', label: 'B', titleKey: 'conditionBuilder.responseType.body' },
	{ value: 'header', label: 'H', titleKey: 'conditionBuilder.responseType.header' },
	{ value: 'status', label: 'S', titleKey: 'conditionBuilder.responseType.status' },
];

const IF_OPERATOR_OPTIONS = Object.values(IfOperatorName).map((value) => ({
	value,
	labelKey: IF_OPERATOR_LABEL_KEYS[value],
}));

const LOOP_OPERATOR_OPTIONS = Object.values(LoopOperatorName).map((value) => ({
	value,
	labelKey: LOOP_OPERATOR_LABEL_KEYS[value],
}));

const normalizeSource = (source?: ConditionValueSource): ConditionValueSource => source || 'direct';
const normalizeResponseType = (type?: ResponseType): ResponseType => type || 'body';

const buildNodeBackedMethods = (
	methods: MethodWithId[],
	nodes: WorkflowNodeModel[],
) => {
	const methodsById = new Map(methods.map((method) => [method.id, method]));
	return nodes
		.filter((node) => node.type === 'connector' || node.type === 'system' || node.type === 'trigger-connection')
		.map((node) => {
			const method = methodsById.get(node.id);
			const label = node.data.subtitle || node.data.title || method?.label || method?.name || node.id;
			return {
				...(method ?? {
					id: node.id,
					index: '',
					name: label,
					label,
					connector: node.type === 'system' || node.type === 'trigger-connection' ? null : node.data.connector ?? null,
					request: {},
					response: {},
				}),
				color: node.data.color ?? method?.color ?? '',
				name: method?.name || label,
				label: method?.label || label,
			} as MethodWithId;
		});
};

const parseWorkflowIndex = (value: unknown) =>
	String(value ?? '')
		.split('_')
		.map((part) => Number(part))
		.map((part) => (Number.isFinite(part) ? part : 0));

const compareWorkflowIndex = (left?: unknown, right?: unknown) => {
	const leftPath = parseWorkflowIndex(left);
	const rightPath = parseWorkflowIndex(right);
	const length = Math.max(leftPath.length, rightPath.length);

	for (let index = 0; index < length; index += 1) {
		const leftPart = leftPath[index] ?? -1;
		const rightPart = rightPath[index] ?? -1;
		if (leftPart !== rightPart) return leftPart - rightPart;
	}

	return leftPath.length - rightPath.length;
};

const getSourceMethods = (
	connection: Connection,
	nodes: WorkflowNodeModel[],
	edges: WorkflowEdgeModel[],
	node: WorkflowNodeModel | null,
) => {
	const methods = connection.fromConnector.method;
	if (!node) return methods;
	if (edges.length > 0) {
		const canReach = (fromNodeId: string, toNodeId: string) => {
			const visited = new Set<string>();
			const stack = [fromNodeId];
			while (stack.length > 0) {
				const current = stack.pop();
				if (!current || visited.has(current)) continue;
				if (current === toNodeId) return true;
				visited.add(current);
				edges.forEach((edge) => {
					if (edge.source === current && !visited.has(edge.target)) stack.push(edge.target);
				});
			}
			return false;
		};
		return methods.filter((method) => canReach(method.id, node.id));
	}
	const operator = connection.fromConnector.operator.find((item) => item.id === node.id);
	if (operator?.index !== undefined) {
		return methods.filter((method) => compareWorkflowIndex(method.index, operator.index) < 0);
	}

	const nodeIndex = nodes.findIndex((item) => item.id === node.id);
	if (nodeIndex < 0) return methods;
	const allowedIds = new Set(
		nodes
			.slice(0, nodeIndex)
			.filter((item) => item.type === 'connector' || item.type === 'system' || item.type === 'trigger-connection')
			.map((item) => item.id),
	);
	return methods.filter((method) => allowedIds.has(method.id));
};

const getCurrentOperator = (
	connection: Connection,
	node: WorkflowNodeModel | null,
) => node ? connection.fromConnector.operator.find((operator) => operator.id === node.id) : undefined;

const isChildIndex = (childIndex?: string, parentIndex?: string) =>
	!!childIndex && !!parentIndex && childIndex !== parentIndex && childIndex.startsWith(`${parentIndex}_`);

const getLoopAncestors = (
	connection: Connection,
	node: WorkflowNodeModel | null,
) => {
	const currentIndex = getCurrentOperator(connection, node)?.index;
	if (!currentIndex) return [];
	return connection.fromConnector.operator
		.filter((operator) => operator.type === 'loop' && isChildIndex(currentIndex, operator.index))
		.sort((left, right) => left.index.split('_').length - right.index.split('_').length);
};

const getPreviousIterators = (
	connection: Connection,
	node: WorkflowNodeModel | null,
) =>
	getLoopAncestors(connection, node)
		.map((operator, index) => (operator as any).iterator || ITERATOR_NAMES[index])
		.filter((iterator): iterator is string => !!iterator);

const getCurrentLoopIterator = (
	connection: Connection,
	node: WorkflowNodeModel | null,
) => {
	if (node?.type !== 'loop') return undefined;
	const existing = node.data.conditionConfig?.iterator || (getCurrentOperator(connection, node) as any)?.iterator;
	if (existing) return existing;
	return ITERATOR_NAMES[getLoopAncestors(connection, node).length];
};

const getFirstRuleLeftField = (group: ConditionGroup): string | undefined => {
	for (const item of group.items ?? []) {
		if (item.type === 'rule') {
			if (item.properties?.leftField) return item.properties.leftField;
		} else {
			const nested = getFirstRuleLeftField(item);
			if (nested) return nested;
		}
	}
	return undefined;
};

const getFirstRuleOperator = (group: ConditionGroup): string | undefined => {
	for (const item of group.items ?? []) {
		if (item.type === 'rule') {
			if (item.properties?.operator) return item.properties.operator;
		} else {
			const nested = getFirstRuleOperator(item);
			if (nested) return nested;
		}
	}
	return undefined;
};

function SourceSwitcher({
	value,
	onChange,
}: {
	value: ConditionValueSource;
	onChange: (value: ConditionValueSource) => void;
}) {
	const { t } = useI18n('workflow');
	return (
		<div className="conditionSourceSwitcher compactRadioGroup">
			{SOURCE_OPTIONS.map((option) => (
				<Radio
					key={option.value}
					checked={value === option.value}
					onChange={() => onChange(option.value)}
					label={<span className="conditionRadioIcon" title={t(option.titleKey)}>{option.icon}</span>}
				/>
			))}
		</div>
	);
}

function ResponseTypeSwitcher({
	value,
	onChange,
}: {
	value: ResponseType;
	onChange: (value: ResponseType) => void;
}) {
	const { t } = useI18n('workflow');
	return (
		<div className="conditionResponseTypeSwitcher compactRadioGroup">
			{RESPONSE_TYPE_OPTIONS.map((option) => (
				<Radio
					key={option.value}
					checked={value === option.value}
					onChange={() => onChange(option.value)}
					label={<span className="conditionRadioIcon conditionResponseTypeIcon" title={t(option.titleKey)}>{option.label}</span>}
				/>
			))}
		</div>
	);
}

function MethodSelect({
	methods,
	selectedMethod,
	value,
	popupZIndex,
	onChange,
}: {
	methods: MethodWithId[];
	selectedMethod?: MethodWithId;
	value?: string;
	popupZIndex?: number;
	onChange: (value?: string) => void;
}) {
	const { t } = useI18n('workflow');
	const selected = methods.find((method) => method.id === value) ?? selectedMethod;
	const options = selectedMethod && !methods.some((method) => method.id === selectedMethod.id)
		? [selectedMethod, ...methods]
		: methods;
	const duplicateIndexByColor = getDuplicateMethodIndexByColor(options);
	return (
		<div className="selectCopyHost">
			<CopyButton value={selected ? getMethodLabel(selected) : ''} className="selectCopyButton" />
			<Select
				placeholder={t('placeholders.selectMethod')}
				value={value}
				className="conditionMethodSelect"
				showSearch
				filterOption={(input, option) => {
					const term = input.toLowerCase();
					const data = option as { label?: unknown; connectorTitle?: string };
					return (
						String(data?.label ?? '').toLowerCase().includes(term) ||
						String(data?.connectorTitle ?? '').toLowerCase().includes(term)
					);
				}}
				prefix={selected ? (
					<MethodConnectorChip method={selected} iconOnly iconSize={18} tooltipZIndex={13020} />
				) : undefined}
				onChange={onChange}
				options={options.map((method) => ({
					value: method.id,
					label: getMethodLabel(method),
					connectorTitle: getMethodConnectorChipInfo(method).title,
					color: method.color,
					dupIndex: method.color ? duplicateIndexByColor.get(method.color.toLowerCase()) : undefined,
					method,
				}))}
				optionRender={(option) => {
					const data = option.data as { connectorTitle?: string; color?: string; dupIndex?: number; method: MethodWithId };
					const isWebhook = getMethodConnectorChipInfo(data.method).kind === 'webhook';
					const row = (
						<span className="conditionMethodOption">
							<span className="conditionMethodLeft">
								<MethodColorDot color={data.color} index={data.dupIndex} />
								<span className="conditionMethodName">{option.label}</span>
							</span>
							<MethodConnectorChip method={data.method} tooltipZIndex={13020} disableTooltip={isWebhook} />
						</span>
					);
					return isWebhook ? (
						<Tooltip content={t('refGenerator.webhookTriggerHint')} placement='right' zIndex={13020}>
							{row}
						</Tooltip>
					) : row;
				}}
				getPopupContainer={() => document.body}
				popupMatchSelectWidth={420}
				styles={{ popup: { root: { zIndex: popupZIndex ?? 13010 } } }}
			/>
		</div>
	);
}

function ConditionValueInput({
	side,
	properties,
	methods,
	allMethods,
	iterators,
	connection,
	operatorIndexPath,
	popupZIndex,
	onChange,
}: {
	side: 'left' | 'right';
	properties: ConditionRuleProperties;
	methods: MethodWithId[];
	allMethods: MethodWithId[];
	iterators: string[];
	connection: Connection;
	operatorIndexPath: string | undefined;
	popupZIndex?: number;
	onChange: (patch: Partial<ConditionRuleProperties>) => void;
}) {
	const { t } = useI18n('workflow');
	const testRun = useTestRun();
	const fieldKey = side === 'left' ? 'leftField' : 'rightField';
	const fieldValue = properties[fieldKey] || '';
	const parsedMethod = parseMethodFromReference(allMethods, fieldValue);
	const parsedResponseType = parseResponseTypeFromReference(fieldValue);
	const [draftSource, setDraftSource] = useState<ConditionValueSource>(() => getSourceFromField(fieldValue));
	const [draftMethodId, setDraftMethodId] = useState<string | undefined>(() => parsedMethod?.id);
	const [draftResponseType, setDraftResponseType] = useState<ResponseType>(() => parsedResponseType || 'body');
	const source = normalizeSource(fieldValue ? getSourceFromField(fieldValue) : draftSource);
	const methodId = fieldValue ? parsedMethod?.id : draftMethodId;
	const responseType = normalizeResponseType(draftResponseType);
	const selectedMethod = allMethods.find((method) => method.id === methodId);

	// Hover-driven live value — same pattern as BodyPointer/RequestReferenceTokens:
	// resolution only fires once the field-select itself is hovered, no eager
	// fetch per operand. `operatorIndexPath` stands in for the "currentMethod"
	// those consumers use, since a condition operand only ever resolves
	// `direction: 'response'` references (never a self "request" reference).
	const [isFieldHovered, setIsFieldHovered] = useState(false);
	const parsedReference = parseConditionOperand(fieldValue);
	const methodContext = operatorIndexPath ? { index: operatorIndexPath } : undefined;
	const { value: liveValue, hasValue: hasLiveValue, isLoading: isLiveValueLoading, canInspect } =
		useLiveReferenceValue(parsedReference, connection, methodContext, isFieldHovered);
	const fieldPath = parsePathFromReference(fieldValue);
	const fieldLabel = selectedMethod
		? `${getMethodLabel(selectedMethod)} · ${responseType}${fieldPath ? `.$.${fieldPath}` : ''}`
		: '';

	useEffect(() => {
		if (!fieldValue) return;
		setDraftSource(getSourceFromField(fieldValue));
		setDraftMethodId(parsedMethod?.id);
		setDraftResponseType(parsedResponseType || 'body');
	}, [fieldValue, parsedMethod?.id, parsedResponseType]);

	const setSource = (nextSource: ConditionValueSource) => {
		setDraftSource(nextSource);
		if (nextSource === 'direct') {
			setDraftResponseType(responseType || 'body');
		}
		onChange({ [fieldKey]: undefined });
	};

	if (source === 'constant') {
		return (
			<div className="conditionValueInput">
				<SourceSwitcher value={source} onChange={setSource} />
				<Input
					placeholder={t('placeholders.constant')}
					value={fieldValue}
					onChange={(event) => onChange({ [fieldKey]: event.target.value })}
					className="conditionConstantInput"
				/>
			</div>
		);
	}

	if (source === 'webhook') {
		return (
			<div className="conditionValueInput conditionValueInputWebhook">
				<SourceSwitcher value={source} onChange={setSource} />
				<LegacyWebhookReferenceSelect
					value={extractWebhookValue(fieldValue) || undefined}
					popupZIndex={popupZIndex}
					onChange={(value) => onChange({ [fieldKey]: value ? webhookSnippet(value) : undefined })}
				/>
			</div>
		);
	}

	return (
		<div className="conditionValueInput">
			<SourceSwitcher value={source} onChange={setSource} />
			<MethodSelect
				methods={methods}
				selectedMethod={selectedMethod}
				value={methodId}
				popupZIndex={popupZIndex}
				onChange={(value) => {
					setDraftMethodId(value);
					onChange({ [fieldKey]: undefined });
				}}
			/>
			<ResponseTypeSwitcher
				value={responseType}
				onChange={(value) => {
					setDraftResponseType(value);
					onChange({
						[fieldKey]: value === 'status' && selectedMethod
							? buildReferenceValue(selectedMethod.color, value, 'status')
							: undefined,
					});
				}}
			/>
			{(() => {
				const fieldSelect = (
					<div
						className={`conditionFieldSelect${canInspect ? ` ${LIVE_INSPECTABLE_CLASS}` : ''}`}
						onMouseEnter={() => setIsFieldHovered(true)}
						onMouseLeave={() => setIsFieldHovered(false)}
					>
						<LegacyResponseFieldSelect
							key={`${selectedMethod?.id ?? 'none'}-${responseType}`}
							method={selectedMethod}
							type={responseType}
							value={parsePathFromReference(fieldValue)}
							disabled={!methodId}
							iterators={iterators}
							popupZIndex={popupZIndex}
							onChange={(value) => {
								const path = parsePathFromReference(value);
								onChange({
									[fieldKey]:
										path && selectedMethod
											? buildReferenceValue(selectedMethod.color, responseType, path)
											: undefined,
								});
							}}
						/>
					</div>
				);
				// Nothing to preview until a method (and therefore a color to
				// resolve against) is actually picked — an empty Tooltip would
				// otherwise still pop an empty bubble on hover. Same while the
				// run isn't paused: there's no live value to show at all, so
				// skip the tooltip entirely rather than popping a label-only bubble.
				if (!selectedMethod || !testRun?.isPaused) return fieldSelect;
				return (
					<Tooltip
						content={
							<LiveReferenceValuePreview
								label={fieldLabel}
								isLoading={isLiveValueLoading}
								hasValue={hasLiveValue}
								rawValue={liveValue}
								formattedValue={hasLiveValue ? formatLiveReferenceValue(liveValue) : null}
							/>
						}
					>
						{fieldSelect}
					</Tooltip>
				);
			})()}
		</div>
	);
}

function ComparisonTooltipContent({
	evaluation,
	isLoading,
}: {
	evaluation: ComparisonEvaluation | null;
	isLoading: boolean;
}) {
	const { t } = useI18n('workflow');

	if (isLoading) return <Loading size="xs" inline />;
	if (!evaluation || evaluation.kind === 'unknown') return <>{t('conditionBuilder.comparisonUnknown')}</>;
	if (evaluation.kind === 'error') return <>{t('conditionBuilder.comparisonError')}</>;
	return (
		<span
			style={{
				color: evaluation.value ? 'var(--color-status-success-fg)' : 'var(--color-status-error-fg)',
				fontWeight: 600,
			}}
		>
			{t(evaluation.value ? 'conditionBuilder.comparisonTrue' : 'conditionBuilder.comparisonFalse')}
		</span>
	);
}

function RuleRow({
	rule,
	operatorType,
	methods,
	allMethods,
	iterators,
	connection,
	operatorIndexPath,
	popupZIndex,
	canDelete,
	onChange,
	onDelete,
	onDuplicate,
}: {
	rule: ConditionRule;
	operatorType: 'if' | 'loop';
	methods: MethodWithId[];
	allMethods: MethodWithId[];
	iterators: string[];
	connection: Connection;
	operatorIndexPath: string | undefined;
	popupZIndex?: number;
	canDelete: boolean;
	onChange: (patch: Partial<ConditionRuleProperties>) => void;
	onDelete: () => void;
	onDuplicate: () => void;
}) {
	const { t } = useI18n('workflow');
	const testRun = useTestRun();
	const properties = rule.properties || {};
	const operator = properties.operator;
	const isLoop = operatorType === 'loop';
	const isUnary = operator && UNARY_IF_OPERATORS.has(operator as IfOperatorName);
	const isSplitString = operator === LoopOperatorName.SplitString;
	const hasBinaryRight = !!operator && !isUnary;

	// Hovering the operator select resolves BOTH operands at once (independent
	// of each ConditionValueInput's own per-field hover state) so the
	// comparison result can be computed and shown — see conditionComparison.ts
	// for the actual evaluation, ported from the backend's operator classes.
	const [isOperatorHovered, setIsOperatorHovered] = useState(false);
	const methodContext = operatorIndexPath ? { index: operatorIndexPath } : undefined;
	const leftReference = !isLoop ? parseConditionOperand(properties.leftField) : null;
	const rightReference = !isLoop && hasBinaryRight ? parseConditionOperand(properties.rightField) : null;
	const leftLive = useLiveReferenceValue(leftReference, connection, methodContext, !isLoop && isOperatorHovered);
	const rightLive = useLiveReferenceValue(rightReference, connection, methodContext, !isLoop && hasBinaryRight && isOperatorHovered);
	const resolveOperand = (field: string | undefined, live: typeof leftLive): OperandInput => {
		const source = getSourceFromField(field);
		if (source === 'constant') return { known: true, value: field ?? '' };
		if (source === 'webhook') return { known: false, value: undefined };
		return { known: live.hasValue, value: live.value };
	};
	const comparisonEvaluation = !isLoop && operator
		? evaluateIfComparison(
			operator as IfOperatorName,
			resolveOperand(properties.leftField, leftLive),
			hasBinaryRight ? resolveOperand(properties.rightField, rightLive) : undefined,
		)
		: null;
	const isComparisonLoading = isOperatorHovered && (leftLive.isLoading || (hasBinaryRight && rightLive.isLoading));

	return (
		<div className={`conditionRule ${isLoop ? 'conditionRuleLoop' : ''}`}>
			{isLoop ? (
				<Select
					placeholder={t('placeholders.selectOperator')}
					value={operator}
					className="conditionOperatorSelect conditionLoopOperatorSelect"
					showSearch
					optionFilterProp="label"
					options={LOOP_OPERATOR_OPTIONS.map((option) => ({ value: option.value, label: t(option.labelKey) }))}
					onChange={(value) => onChange({ operator: value, leftField: undefined, rightField: undefined })}
					suffixIcon={<DownOutlined />}
					getPopupContainer={() => document.body}
					styles={{ popup: { root: { zIndex: popupZIndex ?? 13010 } } }}
				/>
			) : (
				<ConditionValueInput
					side="left"
					properties={properties}
					methods={methods}
					allMethods={allMethods}
					iterators={iterators}
					connection={connection}
					operatorIndexPath={operatorIndexPath}
					popupZIndex={popupZIndex}
					onChange={onChange}
				/>
			)}
			{isLoop ? null : (() => {
				const operatorSelect = (
					<Select
						placeholder={t('placeholders.selectOperator')}
						value={operator}
						className="conditionOperatorSelect"
						showSearch
						optionFilterProp="label"
						options={IF_OPERATOR_OPTIONS
							.map((option) => ({ value: option.value, label: t(option.labelKey) }))
							.sort((a, b) => a.label.localeCompare(b.label))}
						onChange={(value) => onChange({ operator: value, rightField: undefined })}
						suffixIcon={<DownOutlined />}
						getPopupContainer={() => document.body}
						styles={{ popup: { root: { zIndex: popupZIndex ?? 13010 } } }}
					/>
				);
				if (!operator || !testRun?.isPaused) return operatorSelect;
				// Ringed only when at least one operand can actually be read this
				// pause — the comparison tooltip has nothing to evaluate otherwise.
				const canInspectComparison = leftLive.canInspect || rightLive.canInspect;
				return (
					<Tooltip content={<ComparisonTooltipContent evaluation={comparisonEvaluation} isLoading={isComparisonLoading} />}>
						<div
							className={canInspectComparison ? LIVE_INSPECTABLE_CLASS : undefined}
							onMouseEnter={() => setIsOperatorHovered(true)}
							onMouseLeave={() => setIsOperatorHovered(false)}
						>
							{operatorSelect}
						</div>
					</Tooltip>
				);
			})()}
			{isLoop && operator ? (
				<ConditionValueInput
					side="left"
					properties={properties}
					methods={methods}
					allMethods={allMethods}
					iterators={iterators}
					connection={connection}
					operatorIndexPath={operatorIndexPath}
					popupZIndex={popupZIndex}
					onChange={onChange}
				/>
			) : !isLoop && hasBinaryRight ? (
				<ConditionValueInput
					side="right"
					properties={properties}
					methods={methods}
					allMethods={allMethods}
					iterators={iterators}
					connection={connection}
					operatorIndexPath={operatorIndexPath}
					popupZIndex={popupZIndex}
					onChange={onChange}
				/>
			) : null}
			{isLoop && isSplitString && properties.leftField ? (
				<ConditionValueInput
					side="right"
					properties={properties}
					methods={methods}
					allMethods={allMethods}
					iterators={iterators}
					connection={connection}
					operatorIndexPath={operatorIndexPath}
					popupZIndex={popupZIndex}
					onChange={onChange}
				/>
			) : null}
			{canDelete ? (
				<div className="conditionRuleActions">
					<Tooltip content={t('actions.duplicate')}>
						<Button
							type="text"
							className="conditionDuplicateButton"
							icon={<CopyOutlined />}
							onClick={onDuplicate}
						/>
					</Tooltip>
					<Tooltip content={t('actions.delete')}>
						<DeleteIconButton iconSize={14} onClick={onDelete} />
					</Tooltip>
				</div>
			) : null}
		</div>
	);
}

function GroupEditor({
	group,
	operatorType,
	methods,
	allMethods,
	iterators,
	connection,
	operatorIndexPath,
	popupZIndex,
	onDelete,
	onChange,
}: {
	group: ConditionGroup;
	operatorType: 'if' | 'loop';
	methods: MethodWithId[];
	allMethods: MethodWithId[];
	iterators: string[];
	connection: Connection;
	operatorIndexPath: string | undefined;
	popupZIndex?: number;
	onDelete?: () => void;
	onChange: (group: ConditionGroup) => void;
}) {
	const { t } = useI18n('workflow');
	const items = group.items || [];
	const groupBodyRef = useRef<HTMLDivElement | null>(null);
	const [treeLineBottom, setTreeLineBottom] = useState(24);
	const isConjunctionDisabled = items.length <= 1;
	const conjunction = group.properties?.conjunction;
	const activeConjunction = conjunction;
	const groupClassName = operatorType === 'loop'
		? 'conditionLoopGroup'
		: `conditionGroup${group.error ? ' conditionGroupInvalid' : ''}`;
	const groupBodyStyle = {
		'--condition-tree-bottom': `${treeLineBottom}px`,
	} as CSSProperties;

	useLayoutEffect(() => {
		if (operatorType !== 'if') return;
		const body = groupBodyRef.current;
		if (!body) return;

		const updateTreeLine = () => {
			const lastChild = body.lastElementChild;
			if (!(lastChild instanceof HTMLElement)) {
				setTreeLineBottom(24);
				return;
			}

			const connectorOffset = lastChild.classList.contains('conditionRule')
				? lastChild.offsetTop + lastChild.offsetHeight / 2
				: lastChild.offsetTop + 23;
			setTreeLineBottom(Math.max(0, body.offsetHeight - connectorOffset - 2));
		};

		updateTreeLine();
		const observer = new ResizeObserver(updateTreeLine);
		observer.observe(body);
		const lastChild = body.lastElementChild;
		if (lastChild instanceof HTMLElement) observer.observe(lastChild);
		return () => observer.disconnect();
	}, [items.length, operatorType]);

	useEffect(() => {
		if (operatorType !== 'if' || items.length > 1 || conjunction === undefined) return;
		onChange(updateGroupConjunction(group, group.id, undefined));
	}, [conjunction, group, items.length, onChange, operatorType]);

	return (
		<div className={groupClassName}>
			{operatorType === 'if' ? <div className="conditionGroupHeader">
				<div className="conditionGroupStatus">
					<div className="conditionGroupToggle">
						<button
							disabled={isConjunctionDisabled}
							type="button"
							className={activeConjunction === Conjunction.AND ? 'active' : ''}
							onClick={() => onChange(updateGroupConjunction(group, group.id, conjunction === Conjunction.AND ? undefined : Conjunction.AND))}
						>
							AND
						</button>
						<button
							disabled={isConjunctionDisabled}
							type="button"
							className={activeConjunction === Conjunction.OR ? 'active' : ''}
							onClick={() => onChange(updateGroupConjunction(group, group.id, conjunction === Conjunction.OR ? undefined : Conjunction.OR))}
						>
							OR
						</button>
					</div>
					{group.error ? <div className="conditionGroupError">{group.error}</div> : null}
				</div>
				<div className="conditionGroupActions">
					<Button
						type="primary"
						className="conditionGroupAddButton"
						data-testid="workflow-condition-add-condition"
						onClick={() => onChange(appendChildToGroup(group, group.id, createEmptyRule()))}
					>
						{t('conditionBuilder.addCondition')}
					</Button>
					<Button
						type="primary"
						className="conditionGroupAddButton"
						data-testid="workflow-condition-add-group"
						onClick={() => onChange(appendChildToGroup(group, group.id, createEmptyGroup(operatorType)))}
					>
						{t('conditionBuilder.addGroup')}
					</Button>
					{onDelete ? (
						<Tooltip content={t('actions.delete')}>
							<DeleteIconButton iconSize={14} onClick={onDelete} />
						</Tooltip>
					) : null}
				</div>
			</div> : null}
			<div ref={groupBodyRef} className="conditionGroupBody" style={groupBodyStyle}>
				{items.map((child) =>
					child.type === 'rule' ? (
						<RuleRow
							key={child.id}
							rule={child}
							operatorType={operatorType}
							methods={methods}
							allMethods={allMethods}
							iterators={iterators}
							connection={connection}
							operatorIndexPath={operatorIndexPath}
							popupZIndex={popupZIndex}
							canDelete={operatorType === 'if'}
							onDelete={() => onChange(removeChildById(group, child.id))}
							onDuplicate={() => onChange(duplicateRuleById(group, child.id))}
							onChange={(patch) => onChange(updateRuleProperties(group, child.id, patch))}
						/>
					) : (
						<GroupEditor
							key={child.id}
							group={child}
							operatorType={operatorType}
							methods={methods}
							allMethods={allMethods}
							iterators={iterators}
							connection={connection}
							operatorIndexPath={operatorIndexPath}
							popupZIndex={popupZIndex}
							onDelete={() => onChange(removeChildById(group, child.id))}
							onChange={(nextGroup) => {
								onChange({
									...group,
									items: items.map((item) =>
										item.id === nextGroup.id ? nextGroup : item,
									),
								});
							}}
						/>
					),
				)}
			</div>
		</div>
	);
}

export function ConditionBuilderDialog({
	open,
	node,
	nodes,
	edges,
	connection,
	zIndex,
	onClose,
	onSave,
}: Props) {
	const { t } = useI18n('workflow');
	const operatorType = node?.type === 'loop' ? 'loop' : 'if';
	const [tree, setTree] = useState<ConditionGroup>(() => getInitialTreeFromConfig(node, operatorType));
	const [renderKey, setRenderKey] = useState(0);
	const methods = useMemo(
		() => getSourceMethods(connection, nodes, edges, node),
		[connection, edges, node, nodes],
	);
	const allMethods = useMemo(
		() => buildNodeBackedMethods(connection.fromConnector.method, nodes),
		[connection.fromConnector.method, nodes],
	);
	const iterators = useMemo(
		() => getPreviousIterators(connection, node),
		[connection, node],
	);
	const loopIterator = useMemo(
		() => getCurrentLoopIterator(connection, node),
		[connection, node],
	);
	const isLoop = operatorType === 'loop';
	const loopCollectionRef = useMemo(
		() => (isLoop ? getFirstRuleLeftField(tree) : undefined),
		[isLoop, tree],
	);
	const loopOperator = useMemo(
		() => (isLoop ? getFirstRuleOperator(tree) : undefined),
		[isLoop, tree],
	);
	const loopExample = useMemo(() => {
		if (!isLoop || !loopOperator || !loopCollectionRef) return undefined;
		const method = parseMethodFromReference(allMethods, loopCollectionRef);
		if (!method) return undefined;
		return {
			methodLabel: method.label || method.name,
			connectorIcon: getMethodConnectorIcon(method),
			hasMethod: true,
			responseType: parseResponseTypeFromReference(loopCollectionRef) || 'body',
		};
	}, [isLoop, loopOperator, loopCollectionRef, allMethods]);

	useEffect(() => {
		if (!open) return;
		setTree(getInitialTreeFromConfig(node, operatorType));
		setRenderKey((current) => current + 1);
	}, [node, open, operatorType]);

	// The node's own tree-path index — threaded down through GroupEditor/RuleRow
	// to ConditionValueInput, standing in for the "currentMethod" the body
	// editor's hover-value hooks use, so a hovered operand can resolve which
	// loop iteration it's currently paused in (a condition operand only ever
	// resolves `direction: 'response'`, so no method color is needed here).
	const operatorIndexPath = getCurrentOperator(connection, node)?.index;

	return (
		<Modal
			open={open}
			zIndex={zIndex}
			destroyOnHidden
			focusable={{ focusTriggerAfterClose: false }}
			title={t(isLoop ? 'conditionBuilder.dialogTitleLoop' : 'conditionBuilder.dialogTitleIf')}
			width="90vw"
			centered={false}
			className={`wfDialog conditionBuilderModal conditionBuilderModal-${operatorType}`}
			closeIcon={<span className="wfDialogClose">×</span>}
			onCancel={onClose}
			footer={[
				<Button
					key="save"
					type="primary"
					disabled={!node}
					data-testid="workflow-condition-save"
					onClick={() => {
						if (!node) return;
						const result = validateConditionTreeWithErrors(tree, operatorType);
						setTree(result.tree);
						if (!result.isValid) return;
						onSave(node.id, buildConditionConfig(operatorType, result.tree, loopIterator));
					}}
				>
					{t('actions.save')}
				</Button>,
			]}
		>
			<div key={renderKey} className="conditionBuilder" data-testid="workflow-condition-builder">
				<LiveInspectHint />
				<GroupEditor
					group={tree}
					operatorType={operatorType}
					methods={methods}
					allMethods={allMethods}
					iterators={iterators}
					connection={connection}
					operatorIndexPath={operatorIndexPath}
					popupZIndex={zIndex}
					onChange={setTree}
				/>
				{isLoop ? (
					<LoopInfoPanel
						iterator={loopIterator}
						operator={loopOperator}
						example={loopExample}
					/>
				) : null}
			</div>
		</Modal>
	);
}
