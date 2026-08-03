import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { DeleteIconButton } from '@shared/ui/actions/DeleteIconButton';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { parseEnhancementArg } from '../utils/parseEnhancementArg';
import type { MessageProperty } from '../shared/messageProperty';
import type { RootState } from '../../../store';
import type { Method } from '../../../types/connection';
import { useMethodContext } from '../../../providers/MethodContext';
import { updateConnection } from '../../../store/connection/connectionSlice';
import '../body-editor/bodyLegacy.css';

const parseIndex = (value?: string) =>
	String(value ?? '')
		.split('_')
		.map((part) => Number(part))
		.map((part) => (Number.isFinite(part) ? part : 0));

const compareIndex = (left?: string, right?: string) => {
	const leftPath = parseIndex(left);
	const rightPath = parseIndex(right);
	const length = Math.max(leftPath.length, rightPath.length);

	for (let index = 0; index < length; index += 1) {
		const leftPart = leftPath[index] ?? -1;
		const rightPart = rightPath[index] ?? -1;
		if (leftPart !== rightPart) return leftPart - rightPart;
	}

	return leftPath.length - rightPath.length;
};

const isSamePath = (left: number[], right: number[]) =>
	left.length === right.length && left.every((part, index) => part === right[index]);

const isPathPrefix = (prefix: number[], path: number[]) =>
	prefix.length < path.length && prefix.every((part, index) => part === path[index]);

const isReferenceVisible = (providerIndex?: string, consumerIndex?: string) => {
	if (!providerIndex || !consumerIndex) return false;
	if (compareIndex(providerIndex, consumerIndex) >= 0) return false;

	const providerPath = parseIndex(providerIndex);
	const consumerPath = parseIndex(consumerIndex);

	if (isPathPrefix(providerPath, consumerPath)) return true;

	for (let level = consumerPath.length - 1; level >= 0; level -= 1) {
		const parentPath = consumerPath.slice(0, level);
		const consumerSegment = consumerPath[level];
		if (providerPath.length !== level + 1) continue;
		if (!isSamePath(providerPath.slice(0, level), parentPath)) continue;
		if ((providerPath[level] ?? -1) < consumerSegment) return true;
	}

	return false;
};

interface ReferenceInfoProps {
	messageProperty: MessageProperty;
	data: any;
	readOnly?: boolean;
	onReferenceClick?: (enhanceId: string) => void;
	// When provided (JSON body/header editor), deleting a reference removes just that one
	// reference token from the field's raw value — fieldPath is the dotted resultVar path (e.g.
	// "items.[0].name"), pointer is the literal reference token to remove. When omitted (XML,
	// which has no reliable way to resolve a dotted path back to a tree node), delete falls back
	// to removing the whole enhancement, only when it wraps a single reference.
	onDeleteReference?: (fieldPath: string, pointer: string) => void;
}

export const ReferenceInfo: React.FC<ReferenceInfoProps> = ({
	messageProperty,
	data,
	readOnly,
	onReferenceClick,
	onDeleteReference,
}) => {
	const { t } = useI18n('workflow');
	const dispatch = useDispatch();
	const connection = useSelector(
		(state: RootState) => state.connection.connection,
	);
	const { method: currentMethod } = useMethodContext();
	const [hoveredField, setHoveredField] = useState<string | null>(null);
	const [hoveredRef, setHoveredRef] = useState<string | null>(null);

	if (!connection || !currentMethod) {
		return null;
	}

	const paramKey: string = (data?.param?.key || '').trim();

	const fieldBindings = connection.fieldBindings || [];
	const methods = connection.fromConnector.method;

	const fieldReferences: Record<
		string,
		{
			target: string;
			method: Method | null;
			color: string;
			enhanceId: string;
			sourceMessageProperty: string;
			direction: string;
		}[]
	> = {};

	fieldBindings.forEach((binding) => {
		const { enhancement } = binding;
		if (!enhancement) return;

		const { args, enhanceId } = enhancement;
		const resultVar = parseEnhancementArg(args['RESULT_VAR']);
		if (!resultVar) return;

		if (resultVar.messageProperty !== messageProperty) return;

		const resultColor = (resultVar.color || '').toLowerCase();
		const currentColor = (currentMethod.color || '').toLowerCase();
		if (!resultColor || resultColor !== currentColor) return;

		Object.entries(args)
			.filter(([key]) => key.startsWith('VAR_'))
			.forEach(([_, value]) => {
				if (typeof value !== 'string') return;

				const parsed = parseEnhancementArg(value);
				if (!parsed) return;

				const method =
					methods
						.filter((m) => m.color.toLowerCase() === parsed.color.toLowerCase())
						.filter((m) => isReferenceVisible(m.index, currentMethod.index))
						.sort((left, right) => compareIndex(right.index, left.index))[0] || null;

				const keyPath = (resultVar.path || '').trim();
				const arr = fieldReferences[keyPath] ?? [];
				arr.push({
					target: parsed.path,
					method,
					color: parsed.color,
					enhanceId,
					sourceMessageProperty: parsed.messageProperty,
					direction: parsed.direction,
				});
				fieldReferences[keyPath] = arr;
			});
	});

	const hasRefs = Object.keys(fieldReferences).length > 0;

	const formatLeftField = (field: string) => {
		const base = `${messageProperty}.$.`;
		const f = (field || '').trim();

		if (!f) {
			return paramKey ? `${base}${paramKey}` : base;
		}

		if (f.startsWith('.')) {
			return `${messageProperty}.$${f}`;
		}

		return `${base}${f}`;
	};

	const formatSourceField = (messagePropertyName: string, field: string) => {
		const f = (field || '').trim();
		return f ? `${messagePropertyName}.$.${f}` : `${messagePropertyName}.$`;
	};

	// Mirrors parseReference's field-building logic (bodyReference.ts) in reverse, so the
	// reconstructed token is byte-for-byte the same string that appears in the field's raw value.
	const buildReferenceToken = (color: string, direction: string, sourceMessageProperty: string, target: string) => {
		if (sourceMessageProperty === 'status') return `${color}.(${direction}).status`;
		const field = target ? `${sourceMessageProperty}.$.${target}` : `${sourceMessageProperty}.$`;
		return `${color}.(${direction}).${field}`;
	};

	const deleteWholeEnhancement = (enhanceId: string) => {
		if (!connection || !enhanceId) return;
		dispatch(updateConnection({
			fieldBindings: connection.fieldBindings.filter((binding) => binding.enhancement?.enhanceId !== enhanceId),
		} as never));
	};

	return (
		<div style={{ fontFamily: 'Inter, sans-serif', fontSize: 14 }}>
			{Object.entries(fieldReferences).map(([field, refs]) => {
				if (!refs.length) return null;
				const enhanceId = refs[0].enhanceId;
				const rowKey = field || '__empty_field__';
				const isRowHovered = hoveredField === rowKey;
				const canDeleteWholeEnhancement = refs.length <= 1;

				return (
					<div
						key={rowKey}
						onClick={() => {
							if (enhanceId && onReferenceClick) {
								onReferenceClick(enhanceId);
							}
						}}
						style={{
							marginBottom: 8,
							cursor: 'pointer',
							padding: '6px 4px',
							borderRadius: 6,
							boxShadow: isRowHovered ? 'var(--shadow-md)' : 'none',
							background: isRowHovered ? 'var(--color-background-hover)' : 'transparent',
							transition: 'box-shadow 0.15s ease, background 0.15s ease',
						}}
						onMouseEnter={() => setHoveredField(rowKey)}
						onMouseLeave={() => setHoveredField((prev) => (prev === rowKey ? null : prev))}
					>
						<div style={{ marginBottom: 4 }}>
							<span
								style={{
									color: 'var(--color-action-primary)',
									fontFamily: 'monospace',
									fontWeight: 600,
								}}
							>
								{formatLeftField(field)}
							</span>{' '}
							has {refs.length > 1 ? 'next references:' : 'one reference:'}
						</div>

						<div
							style={{
								margin: '4px 0 0 0',
								display: 'grid',
								gap: '8px',
							}}
						>
							{refs.map((r, i) => {
								const refKey = `${rowKey}__${i}`;
								const isRefHovered = hoveredRef === refKey;
								const canDelete = onDeleteReference ? true : canDeleteWholeEnhancement;

								return (
									<div
										key={i}
										className='bodyLegacyReferenceItem'
										onMouseEnter={() => setHoveredRef(refKey)}
										onMouseLeave={() => setHoveredRef((prev) => (prev === refKey ? null : prev))}
										style={{
											display: 'inline-flex',
											flexWrap: 'wrap',
											alignItems: 'center',
											gap: 4,
											padding: '4px 24px 4px 6px',
											borderRadius: 6,
											border: '1px solid var(--color-border-subtle)',
											background: 'var(--color-background-hover)',
										}}
									>
										<span
											style={{
												backgroundColor: r.method?.color || r.color,
												color: 'var(--color-text-on-action)',
												padding: '2px 6px',
												borderRadius: 4,
												fontWeight: 600,
												fontSize: 12,
											}}
										>
											{r.method?.name || 'UnknownMethod'}
										</span>
										<span> bound with </span>
										<span
											style={{
												color: r.color,
												fontFamily: 'monospace',
												fontWeight: 500,
											}}
										>
											{formatSourceField(r.sourceMessageProperty, r.target)}
										</span>
										<span>{i === refs.length - 1 ? ' field.' : ' field; '}</span>

										{isRefHovered && !readOnly ? (
											<span
												style={{ position: 'absolute', top: '50%', right: 2, transform: 'translateY(-50%)' }}
												onClick={(event) => event.stopPropagation()}
											>
												<Tooltip content={t(canDelete ? 'actions.deleteReference' : 'enhancement.deleteDisabledMultipleReferences')}>
													<DeleteIconButton
														iconSize={13}
														disabled={!canDelete}
														testId={`workflow-reference-info-delete-${refKey}`}
														onClick={() => {
															if (onDeleteReference) {
																onDeleteReference(field, buildReferenceToken(r.color, r.direction, r.sourceMessageProperty, r.target));
															} else {
																deleteWholeEnhancement(enhanceId);
															}
														}}
													/>
												</Tooltip>
											</span>
										) : null}
									</div>
								);
							})}
						</div>
					</div>
				);
			})}

			{!hasRefs && (
				<div style={{ opacity: 0.6 }}>
					No references found in {messageProperty}.
				</div>
			)}
		</div>
	);
};
