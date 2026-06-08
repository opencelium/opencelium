import {
	ApiOutlined,
	DeleteOutlined,
	DownOutlined,
	LinkOutlined,
	NumberOutlined,
} from '@ant-design/icons';
import { Button, Input, Modal, Select } from 'antd';
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import type { Connection, MethodWithId } from '../../types/connection';
import type { WorkflowNodeModel } from '../../types/workflow.types';
import { LegacyResponseFieldSelect } from '../request-editor/body-editor/LegacyResponseFieldSelect';
import { LegacyWebhookReferenceSelect } from '../request-editor/body-editor/LegacyWebhookReferenceSelect';
import {
	buildReferenceValue,
	ITERATOR_NAMES,
	type ResponseType,
} from '../request-editor/body-editor/requestReferenceOptions';
import { extractWebhookValue, webhookSnippet } from '../request-editor/body-editor/bodyWebhook';
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
	getInitialTreeFromConfig,
	removeChildById,
	updateGroupConjunction,
	updateRuleProperties,
	validateConditionTreeWithErrors,
} from './conditionBuilder.utils';
import { Radio } from '@shared/ui/primitives/Radio';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import '../request-editor/body-editor/bodyLegacy.css';
import './conditionBuilder.css';

type Props = {
	open: boolean;
	node: WorkflowNodeModel | null;
	nodes: WorkflowNodeModel[];
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

const parseMethodFromReference = (methods: MethodWithId[], value?: string) => {
	if (!value) return undefined;
	const color = value.match(/^#?([A-Fa-f0-9]{6})\.\(response\)\./)?.[1];
	return color
		? methods.find((method) => method.color.replace('#', '').toLowerCase() === color.toLowerCase())
		: undefined;
};

const parseResponseTypeFromReference = (value?: string): ResponseType | undefined => {
	if (value?.includes('.header.')) return 'header';
	if (value?.includes('.status')) return 'status';
	if (value?.includes('.body.')) return 'body';
	return undefined;
};

const parsePathFromReference = (value?: string) => {
	if (!value) return undefined;
	if (value.includes('(response).status')) return 'status';
	const match = value.match(/\.(body|header)(?:\.\$\.?|\.)?(.*)$/);
	const path = match?.[2] || value;
	if (match && path === '') return '$';
	return path.replace(/^#?[A-Fa-f0-9]{6}\.\(response\)\.(body|header)\.\$\.?/, '');
};

const getSourceFromField = (field?: string): ConditionValueSource => {
	if (!field) return 'direct';
	if (field.startsWith('${') && field.endsWith('}')) return 'webhook';
	if (/^#?[A-Fa-f0-9]{6}\.\(response\)\./.test(field)) return 'direct';
	return 'constant';
};

const getMethodLabel = (method: MethodWithId) =>
	method.label || method.name || method.index || method.id;

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
	node: WorkflowNodeModel | null,
) => {
	const methods = connection.fromConnector.method;
	if (!node) return methods;
	const operator = connection.fromConnector.operator.find((item) => item.id === node.id);
	if (operator?.index !== undefined) {
		return methods.filter((method) => compareWorkflowIndex(method.index, operator.index) < 0);
	}

	const nodeIndex = nodes.findIndex((item) => item.id === node.id);
	if (nodeIndex < 0) return methods;
	const allowedIds = new Set(
		nodes
			.slice(0, nodeIndex)
			.filter((item) => item.type === 'connector' || item.type === 'system')
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
	value,
	onChange,
}: {
	methods: MethodWithId[];
	value?: string;
	onChange: (value?: string) => void;
}) {
	const { t } = useI18n('workflow');
	return (
		<Select
			placeholder={t('placeholders.selectMethod')}
			value={value}
			className="conditionMethodSelect"
			onChange={onChange}
			options={methods.map((method) => ({
				value: method.id,
				label: (
					<span className="conditionMethodOption">
						<span className="conditionMethodDot" style={{ background: method.color }} />
						<span>{getMethodLabel(method)}</span>
					</span>
				),
			}))}
			getPopupContainer={() => document.body}
			styles={{ popup: { root: { zIndex: 13010 } } }}
		/>
	);
}

function ConditionValueInput({
	side,
	properties,
	methods,
	iterators,
	onChange,
}: {
	side: 'left' | 'right';
	properties: ConditionRuleProperties;
	methods: MethodWithId[];
	iterators: string[];
	onChange: (patch: Partial<ConditionRuleProperties>) => void;
}) {
	const { t } = useI18n('workflow');
	const fieldKey = side === 'left' ? 'leftField' : 'rightField';
	const fieldValue = properties[fieldKey] || '';
	const parsedMethod = parseMethodFromReference(methods, fieldValue);
	const parsedResponseType = parseResponseTypeFromReference(fieldValue);
	const [draftSource, setDraftSource] = useState<ConditionValueSource>(() => getSourceFromField(fieldValue));
	const [draftMethodId, setDraftMethodId] = useState<string | undefined>(() => parsedMethod?.id);
	const [draftResponseType, setDraftResponseType] = useState<ResponseType>(() => parsedResponseType || 'body');
	const source = normalizeSource(fieldValue ? getSourceFromField(fieldValue) : draftSource);
	const methodId = draftMethodId || parsedMethod?.id;
	const responseType = normalizeResponseType(draftResponseType);
	const selectedMethod = methods.find((method) => method.id === methodId);

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
	iterators,
	canDelete,
	onChange,
	onDelete,
}: {
	rule: ConditionRule;
	operatorType: 'if' | 'loop';
	methods: MethodWithId[];
	iterators: string[];
	canDelete: boolean;
	onChange: (patch: Partial<ConditionRuleProperties>) => void;
	onDelete: () => void;
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
					iterators={iterators}
					onChange={onChange}
				/>
			)}
			{isLoop ? null : (
				<Select
					placeholder={t('placeholders.selectOperator')}
					value={operator}
					className="conditionOperatorSelect"
					options={IF_OPERATOR_OPTIONS.map((option) => ({ value: option.value, label: t(option.labelKey) }))}
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
					iterators={iterators}
					onChange={onChange}
				/>
			) : !isLoop && hasBinaryRight ? (
				<ConditionValueInput
					side="right"
					properties={properties}
					methods={methods}
					iterators={iterators}
					onChange={onChange}
				/>
			) : null}
			{isLoop && isSplitString && properties.leftField ? (
				<ConditionValueInput
					side="right"
					properties={properties}
					methods={methods}
					iterators={iterators}
					onChange={onChange}
				/>
			) : null}
			{canDelete ? <Button
				type="text"
				className="conditionDeleteButton"
				icon={<DeleteOutlined />}
				onClick={onDelete}
			/> : null}
		</div>
	);
}

function GroupEditor({
	group,
	operatorType,
	methods,
	iterators,
	onChange,
}: {
	group: ConditionGroup;
	operatorType: 'if' | 'loop';
	methods: MethodWithId[];
	iterators: string[];
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
						onClick={() => onChange(appendChildToGroup(group, group.id, createEmptyRule()))}
					>
						{t('conditionBuilder.addCondition')}
					</Button>
					<Button
						type="primary"
						onClick={() => onChange(appendChildToGroup(group, group.id, createEmptyGroup(operatorType)))}
					>
						{t('conditionBuilder.addGroup')}
					</Button>
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
							iterators={iterators}
							canDelete={operatorType === 'if'}
							onDelete={() => onChange(removeChildById(group, child.id))}
							onChange={(patch) => onChange(updateRuleProperties(group, child.id, patch))}
						/>
					) : (
						<GroupEditor
							key={child.id}
							group={child}
							operatorType={operatorType}
							methods={methods}
							iterators={iterators}
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
	connection,
	onClose,
	onSave,
}: Props) {
	const { t } = useI18n('workflow');
	const operatorType = node?.type === 'loop' ? 'loop' : 'if';
	const [tree, setTree] = useState<ConditionGroup>(() => getInitialTreeFromConfig(node, operatorType));
	const [renderKey, setRenderKey] = useState(0);
	const methods = useMemo(
		() => getSourceMethods(connection, nodes, node),
		[connection, node, nodes],
	);
	const iterators = useMemo(
		() => getPreviousIterators(connection, node),
		[connection, node],
	);
	const loopIterator = useMemo(
		() => getCurrentLoopIterator(connection, node),
		[connection, node],
	);

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
			title={t('conditionBuilder.dialogTitle')}
			width="90vw"
			centered={false}
			className={`conditionBuilderModal conditionBuilderModal-${operatorType}`}
			closeIcon={<span className="conditionClose">×</span>}
			onCancel={onClose}
			footer={[
				<Button
					key="save"
					type="primary"
					disabled={!node}
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
			<div key={renderKey} className="conditionBuilder">
				<GroupEditor
					group={tree}
					operatorType={operatorType}
					methods={methods}
					iterators={iterators}
					onChange={setTree}
				/>
			</div>
		</Modal>
	);
}
