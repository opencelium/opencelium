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
import { LegacyResponseFieldSelect } from '../request-editor/body-editor/LegacyResponseFieldSelect';
import { LegacyWebhookReferenceSelect } from '../request-editor/body-editor/LegacyWebhookReferenceSelect';
import {
	buildReferenceValue,
	getMethodConnectorChipInfo,
	getMethodConnectorIcon,
	ITERATOR_NAMES,
	type ResponseType,
} from '../request-editor/body-editor/requestReferenceOptions';
import { extractWebhookValue, webhookSnippet } from '../request-editor/body-editor/bodyWebhook';
import { MethodConnectorChip } from '../request-editor/body-editor/MethodConnectorChip';
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
	removeChildById,
	updateGroupConjunction,
	updateRuleProperties,
	validateConditionTreeWithErrors,
} from './conditionBuilder.utils';
import { LoopInfoPanel } from './LoopInfoPanel';
import { Radio } from '@shared/ui/primitives/Radio';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { CopyButton } from '@shared/ui/actions/CopyButton';
import { DeleteIconButton } from '@shared/ui/actions/DeleteIconButton';
import { MethodColorDot } from '../MethodColorDot/MethodColorDot';
import { getDuplicateMethodIndexByColor } from '../../utils/methodColor';
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

const unwrapConditionReference = (value?: string) =>
	value
		?.trim()
		.replace(/^\{%\s*/, '')
		.replace(/\s*%}$/, '');

const parseMethodFromReference = (methods: MethodWithId[], value?: string) => {
	const reference = unwrapConditionReference(value);
	if (!reference) return undefined;
	const color = reference.match(/^#?([A-Fa-f0-9]{6})\.\(response\)\./)?.[1];
	return color
		? methods.find((method) => method.color.replace('#', '').toLowerCase() === color.toLowerCase())
		: undefined;
};

const parseResponseTypeFromReference = (value?: string): ResponseType | undefined => {
	const reference = unwrapConditionReference(value);
	if (reference?.includes('.header.')) return 'header';
	if (reference?.includes('.status')) return 'status';
	if (reference?.includes('.body.')) return 'body';
	return undefined;
};

const parsePathFromReference = (value?: string) => {
	const reference = unwrapConditionReference(value);
	if (!reference) return undefined;
	if (reference === '$' || reference === '$.') return '$';
	if (reference.includes('(response).status')) return 'status';
	const match = reference.match(/\.(body|header)(?:\.\$\.?|\.)?(.*)$/);
	if (match && match[2] === '') return '$';
	const path = match?.[2] || reference;
	return path.replace(/^#?[A-Fa-f0-9]{6}\.\(response\)\.(body|header)\.\$\.?/, '');
};

const getSourceFromField = (field?: string): ConditionValueSource => {
	const reference = unwrapConditionReference(field);
	if (!reference) return 'direct';
	if (reference.startsWith('${') && reference.endsWith('}')) return 'webhook';
	if (/^#?[A-Fa-f0-9]{6}\.\(response\)\./.test(reference)) return 'direct';
	return 'constant';
};

const getMethodLabel = (method: MethodWithId) =>
	method.label || method.name || method.index || method.id;

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
	onChange,
}: {
	methods: MethodWithId[];
	selectedMethod?: MethodWithId;
	value?: string;
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
				styles={{ popup: { root: { zIndex: 13010 } } }}
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
	onChange,
}: {
	side: 'left' | 'right';
	properties: ConditionRuleProperties;
	methods: MethodWithId[];
	allMethods: MethodWithId[];
	iterators: string[];
	onChange: (patch: Partial<ConditionRuleProperties>) => void;
}) {
	const { t } = useI18n('workflow');
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
			<div className="conditionFieldSelect">
				<LegacyResponseFieldSelect
					key={`${selectedMethod?.id ?? 'none'}-${responseType}`}
					method={selectedMethod}
					type={responseType}
					value={parsePathFromReference(fieldValue)}
					disabled={!methodId}
					iterators={iterators}
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
		</div>
	);
}

function RuleRow({
	rule,
	operatorType,
	methods,
	allMethods,
	iterators,
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
	canDelete: boolean;
	onChange: (patch: Partial<ConditionRuleProperties>) => void;
	onDelete: () => void;
	onDuplicate: () => void;
}) {
	const { t } = useI18n('workflow');
	const properties = rule.properties || {};
	const operator = properties.operator;
	const isLoop = operatorType === 'loop';
	const isUnary = operator && UNARY_IF_OPERATORS.has(operator as IfOperatorName);
	const isSplitString = operator === LoopOperatorName.SplitString;
	const hasBinaryRight = !!operator && !isUnary;

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
				/>
			) : (
				<ConditionValueInput
					side="left"
					properties={properties}
					methods={methods}
					allMethods={allMethods}
					iterators={iterators}
					onChange={onChange}
				/>
			)}
			{isLoop ? null : (
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
				/>
			)}
			{isLoop && operator ? (
				<ConditionValueInput
					side="left"
					properties={properties}
					methods={methods}
					allMethods={allMethods}
					iterators={iterators}
					onChange={onChange}
				/>
			) : !isLoop && hasBinaryRight ? (
				<ConditionValueInput
					side="right"
					properties={properties}
					methods={methods}
					allMethods={allMethods}
					iterators={iterators}
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
	onDelete,
	onChange,
}: {
	group: ConditionGroup;
	operatorType: 'if' | 'loop';
	methods: MethodWithId[];
	allMethods: MethodWithId[];
	iterators: string[];
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

	return (
		<Modal
			open={open}
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
				<GroupEditor
					group={tree}
					operatorType={operatorType}
					methods={methods}
					allMethods={allMethods}
					iterators={iterators}
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
