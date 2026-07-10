import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from 'antd';
import type { Connection, MethodWithId } from '../../../types/connection';
import {
	buildReferenceValue,
	getIteratorsForMethod,
	getMethodConnectorIcon,
	getMethodConnectorTitle,
	getReferenceOptions,
	isExpandableReferencePath,
	type ResponseType,
} from '../body-editor/requestReferenceOptions';
import { Radio } from '@shared/ui/primitives/Radio';
import { Select } from '@shared/ui/primitives/Select';
import { ConnectorIcon } from '@entities/connector/ui/ConnectorIcon';
import { MethodColorDot } from '../../MethodColorDot';
import { getDuplicateMethodIndexByColor } from '../../../utils/methodColor';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import '../body-editor/bodyLegacy.css';

interface ReferenceGeneratorProps {
	open: boolean;
	connection: Connection | null;
	currentMethod: MethodWithId;
	onClose: () => void;
	onApply: (reference: string) => void;
	resetKey?: number;
	allowResponseTypes?: ResponseType[];
}

interface OptionType {
	label: string;
	value: string;
}

const getReferenceFilterTerm = (value: string) => {
	const normalized = String(value || '');
	const lastDotIndex = normalized.lastIndexOf('.');
	const lastBracketIndex = normalized.lastIndexOf(']');
	const splitIndex = Math.max(lastDotIndex, lastBracketIndex);
	return splitIndex >= 0 ? normalized.slice(splitIndex + 1).toLowerCase() : normalized.toLowerCase();
};

type WorkflowEdgeLike = {
	source?: string;
	target?: string;
};

const getWorkflowEdges = (connection: Connection): WorkflowEdgeLike[] => {
	const ui = connection.ui as any;
	if (Array.isArray(ui?.workflowEdges)) return ui.workflowEdges;
	if (Array.isArray(ui?.flowchartEdges)) return ui.flowchartEdges;
	return [];
};

const getUpstreamNodeIds = (currentMethodId: string, edges: WorkflowEdgeLike[]) => {
	const sourcesByTarget = new Map<string, string[]>();

	edges.forEach((edge) => {
		if (!edge.source || !edge.target) return;
		sourcesByTarget.set(edge.target, [...(sourcesByTarget.get(edge.target) ?? []), edge.source]);
	});

	const upstream = new Set<string>();
	const queue = [...(sourcesByTarget.get(currentMethodId) ?? [])];

	while (queue.length) {
		const nodeId = queue.shift();
		if (!nodeId || upstream.has(nodeId)) continue;
		upstream.add(nodeId);
		queue.push(...(sourcesByTarget.get(nodeId) ?? []));
	}

	return upstream;
};

const ReferenceGenerator: React.FC<ReferenceGeneratorProps> = ({
	open,
	connection,
	currentMethod,
	onClose,
	onApply,
	resetKey,
	allowResponseTypes = ['body'],
}) => {
	const { t } = useI18n('workflow');
	const [selectedConnector, setSelectedConnector] = useState<string>('');
	const [isConnectorDropdownOpen, setIsConnectorDropdownOpen] =
		useState<boolean>(false);

	const [selectedMethodId, setSelectedMethodId] = useState<string>('');

	const [searchValue, setSearchValue] = useState<string>('');
	const [selectedOption, setSelectedOption] = useState<OptionType | null>(null);
	const [filteredOptions, setFilteredOptions] = useState<OptionType[]>([]);
	const [responseType, setResponseType] = useState<ResponseType>(
		allowResponseTypes[0] ?? 'body',
	);

	const fieldContainerRef = useRef<HTMLDivElement | null>(null);
	const fieldDropdownRef = useRef<HTMLDivElement | null>(null);
	const fieldInputRef = useRef<HTMLInputElement | null>(null);
	const connectorSelectRef = useRef<HTMLDivElement | null>(null);
	const connectorDropdownRef = useRef<HTMLDivElement | null>(null);

	const [dropdownPosition, setDropdownPosition] = useState<{
		top: number;
		left: number;
		width: number;
	} | null>(null);
	const [connectorDropdownPosition, setConnectorDropdownPosition] = useState<{
		top: number;
		left: number;
		width: number;
	} | null>(null);

	const eligibleMethods: MethodWithId[] = useMemo(() => {
		if (!connection) return [];

		const all = connection.fromConnector.method;
		const workflowEdges = getWorkflowEdges(connection);
		if (workflowEdges.length > 0) {
			const upstreamNodeIds = getUpstreamNodeIds(currentMethod.id, workflowEdges);
			return all.filter((method) => method.id !== currentMethod.id && upstreamNodeIds.has(method.id));
		}

		const currentIndex: number =
			(currentMethod as any).index ?? (currentMethod as any).order ?? 0;

		if (currentIndex === undefined || currentIndex === null) {
			return all.filter((m) => m.id !== currentMethod.id);
		}

		return all.filter((m) => {
			if (m.id === currentMethod.id) return false;
			const idx: number = (m as any).index ?? (m as any).order ?? 0;
			return idx < currentIndex;
		});
	}, [connection, currentMethod]);

	const connectorOptions = useMemo(() => {
		const seen = new Set<string>();
		return eligibleMethods.reduce<{ label: string; value: string }[]>((options, method) => {
			const title = getMethodConnectorTitle(method);
			if (seen.has(title)) return options;
			seen.add(title);
			options.push({ label: title, value: title });
			return options;
		}, []);
	}, [eligibleMethods]);

	const methods = useMemo(
		() =>
			selectedConnector
				? eligibleMethods.filter((method) => getMethodConnectorTitle(method) === selectedConnector)
				: [],
		[eligibleMethods, selectedConnector],
	);

	const getMethodLabel = (m: MethodWithId) =>
		String(m.label || m.name || (m as any).index || m.id);

	const duplicateIndexByColor = useMemo(
		() => getDuplicateMethodIndexByColor(connection?.fromConnector.method ?? []),
		[connection],
	);

	const methodOptions = useMemo(() => {
			return methods.map((m) => ({
				value: m.id,
				searchLabel: getMethodLabel(m),
				label: (
					<span
						style={{
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'space-between',
							gap: 12,
							width: '100%',
						}}
					>
						<span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
							<MethodColorDot
								color={m.color}
								index={m.color ? duplicateIndexByColor.get(m.color.toLowerCase()) : undefined}
							/>
							<span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
								{getMethodLabel(m)}
							</span>
						</span>
						<span
							style={{
								display: 'inline-flex',
								alignItems: 'center',
								gap: 6,
								flexShrink: 0,
								color: 'var(--color-text-secondary)',
							}}
						>
							<ConnectorIcon icon={getMethodConnectorIcon(m)} size={16} style={{ flexShrink: 0 }} />
							<span style={{ fontSize: 12 }}>{getMethodConnectorTitle(m)}</span>
						</span>
					</span>
				),
			}));
	}, [methods, duplicateIndexByColor]);

	const handleMethodChange = (id: string) => {
		setSelectedMethodId(id);
		setSearchValue('');
		setSelectedOption(null);
		setFilteredOptions([]);
	};

	const selectedMethod: MethodWithId | undefined = useMemo(
		() => methods.find((m) => m.id === selectedMethodId),
		[methods, selectedMethodId],
	);
	const previousFieldResetKeyRef = useRef('');
	const currentMethodIterators = useMemo(
		() => (connection ? getIteratorsForMethod(connection, currentMethod) : []),
		[connection, currentMethod],
	);

	useEffect(() => {
		if (!open) {
			previousFieldResetKeyRef.current = '';
			setSelectedConnector('');
			setIsConnectorDropdownOpen(false);

			setSelectedMethodId('');

			setResponseType(allowResponseTypes[0] ?? 'body');
			setSearchValue('');
			setSelectedOption(null);
			setFilteredOptions([]);
			setDropdownPosition(null);
			setConnectorDropdownPosition(null);
		}
	}, [open]);

	useEffect(() => {
		if (!open) return;

		previousFieldResetKeyRef.current = '';
		setSelectedConnector('');
		setIsConnectorDropdownOpen(false);

		setSelectedMethodId('');

		setResponseType(allowResponseTypes[0] ?? 'body');
		setSearchValue('');
		setSelectedOption(null);
		setFilteredOptions([]);
		setDropdownPosition(null);
		setConnectorDropdownPosition(null);

		requestAnimationFrame(() => {
			try {
				(
					fieldContainerRef.current?.querySelector(
						'input',
					) as HTMLInputElement | null
				)?.focus?.();
			} catch {
				
			}
		});
	}, [resetKey, open]);

	useEffect(() => {
		if (!selectedMethod) {
			setSearchValue('');
			setSelectedOption(null);
			setFilteredOptions([]);
			setDropdownPosition(null);
			return;
		}

		const fieldResetKey = `${selectedMethod.id}:${responseType}`;
		if (previousFieldResetKeyRef.current === fieldResetKey) return;
		previousFieldResetKeyRef.current = fieldResetKey;

		if (responseType === 'status') {
			setSearchValue('Response Status');
			setSelectedOption({ label: 'Response Status', value: 'status' });
			setFilteredOptions([]);
			setDropdownPosition(null);
			return;
		}

		setSearchValue('');
		setSelectedOption(null);
		const nextOptions = getReferenceOptions(selectedMethod, responseType, '', currentMethodIterators, t);
		setFilteredOptions(nextOptions);
		setDropdownPosition(null);
		requestAnimationFrame(() => {
			fieldInputRef.current?.focus();
			updateDropdownPosition();
		});
	}, [selectedMethod, responseType]);

	const updateDropdownPosition = () => {
		if (!fieldInputRef.current) return;

		const rect = fieldInputRef.current.getBoundingClientRect();
		setDropdownPosition({
			top: rect.bottom + window.scrollY,
			left: rect.left + window.scrollX,
			width: rect.width,
		});
	};
	const updateConnectorDropdownPosition = () => {
		if (!connectorSelectRef.current) return;

		const rect = connectorSelectRef.current.getBoundingClientRect();
		setConnectorDropdownPosition({
			top: rect.bottom + window.scrollY,
			left: rect.left + window.scrollX,
			width: rect.width,
		});
	};

	const isDropdownOpen = !!selectedMethod && filteredOptions.length > 0;
	const isConnectorListOpen =
		isConnectorDropdownOpen && connectorOptions.length > 0;

	useEffect(() => {
		if (!isDropdownOpen) {
			setDropdownPosition(null);
			return;
		}

		updateDropdownPosition();

		const handleScroll = () => updateDropdownPosition();
		const handleResize = () => updateDropdownPosition();

		window.addEventListener('scroll', handleScroll, true);
		window.addEventListener('resize', handleResize);

		return () => {
			window.removeEventListener('scroll', handleScroll, true);
			window.removeEventListener('resize', handleResize);
		};
	}, [isDropdownOpen]);
	useEffect(() => {
		if (!isConnectorListOpen) {
			setConnectorDropdownPosition(null);
			return;
		}

		updateConnectorDropdownPosition();

		const handleScroll = () => updateConnectorDropdownPosition();
		const handleResize = () => updateConnectorDropdownPosition();

		window.addEventListener('scroll', handleScroll, true);
		window.addEventListener('resize', handleResize);

		return () => {
			window.removeEventListener('scroll', handleScroll, true);
			window.removeEventListener('resize', handleResize);
		};
	}, [isConnectorListOpen]);

	const handleFieldInputChange = (value: string) => {
		setSearchValue(value);
		if (!selectedMethod) return;
		if (responseType === 'status') {
			setSearchValue('Response Status');
			setSelectedOption({ label: 'Response Status', value: 'status' });
			setFilteredOptions([]);
			return;
		}

		if (!value) {
			setSelectedOption(null);
			setFilteredOptions(getReferenceOptions(selectedMethod, responseType, '', currentMethodIterators, t));
			return;
		}

		if (value === '$' || value === '$.') {
			setSelectedOption({ label: 'The root object', value: '$.' });
			setFilteredOptions([]);
			return;
		}

		const baseOptions = getReferenceOptions(selectedMethod, responseType, value, currentMethodIterators, t);
		const term = getReferenceFilterTerm(value);

		const filtered =
			term === ''
				? baseOptions
				: baseOptions.filter(
						(opt) =>
							opt.label.toLowerCase().includes(term) ||
							opt.value.toLowerCase().includes(term),
					);

		setFilteredOptions(filtered);

		const exact = filtered.find((opt) => opt.value === value);
		setSelectedOption(exact ?? null);
	};

	const applyResponseType = (nextType: ResponseType) => {
		setResponseType(nextType);
		if (nextType === 'status') {
			setSearchValue('Response Status');
			setSelectedOption({ label: 'Response Status', value: 'status' });
			setFilteredOptions([]);
			setDropdownPosition(null);
			return;
		}
		setSearchValue('');
		setSelectedOption(null);
		if (selectedMethod) {
			const nextOptions = getReferenceOptions(selectedMethod, nextType, '', currentMethodIterators, t);
			setFilteredOptions(nextOptions);
			requestAnimationFrame(() => {
				fieldInputRef.current?.focus();
				updateDropdownPosition();
			});
		}
	};

	const handleOptionClick = (opt: OptionType) => {
		setSelectedOption(opt);
		setSearchValue(opt.value);
		if (!selectedMethod) return;

		if (opt.value === '$' || opt.value === '$.') {
			setFilteredOptions([]);
			setDropdownPosition(null);
			return;
		}

		if (isExpandableReferencePath(selectedMethod, responseType, opt.value, currentMethodIterators)) {
			const nextOptions = getReferenceOptions(selectedMethod, responseType, opt.value, currentMethodIterators, t);
			setFilteredOptions(nextOptions);
			return;
		}
		setFilteredOptions([]);
	};

	useEffect(() => {
		if (!isConnectorDropdownOpen) return;

		const handleClickOutside = (e: MouseEvent) => {
			const target = e.target as Node;

			const inConnector =
				connectorSelectRef.current &&
				connectorSelectRef.current.contains(target);
			const inConnectorDropdown =
				connectorDropdownRef.current &&
				connectorDropdownRef.current.contains(target);

			if (!inConnector && !inConnectorDropdown)
				setIsConnectorDropdownOpen(false);
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [isConnectorDropdownOpen]);

	if (!open) return null;

	const handleApply = () => {
		if (!selectedMethod) return;

		const finalPath = selectedOption?.value || searchValue.trim();
		if (!finalPath) return;

		const reference = buildReferenceValue(
			selectedMethod.color,
			responseType,
			finalPath,
		);
		onApply(reference);
	};

	const canInsert = !!selectedMethod && !!(selectedOption || searchValue.trim());

	const methodPlaceholder = methods.length
		? t('placeholders.selectMethod')
		: t('placeholders.noPreviousMethods');

	const selectedConnectorLabel = selectedConnector || t('placeholders.selectConnector');

	return (
		<>
			<div
				style={{
					marginTop: 8,
					padding: 8,
					border: '1px solid var(--color-border-default)',
					borderRadius: 4,
					background: 'var(--color-background-hover)',
					fontSize: 12,
					position: 'relative',
				}}
			>
				<div
					style={{
						display: 'flex',
						flexDirection: 'column',
						gap: 8,
						marginBottom: 6,
					}}
				>
					<div
						style={{ flex: 1, position: 'relative' }}
						ref={connectorSelectRef}
					>
						<div style={{ marginBottom: 4 }}>{t('refGenerator.connector')}</div>

						<div
							onClick={() => {
								if (!connectorOptions.length) return;
								setIsConnectorDropdownOpen((prev) => !prev);
							}}
							style={{
								width: '100%',
								padding: '4px 6px',
								fontSize: 12,
								boxSizing: 'border-box',
								border: '1px solid var(--color-border-default)',
								borderRadius: 4,
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'space-between',
								backgroundColor: 'var(--color-background-surface)',
								cursor: 'pointer',
							}}
						>
							<div
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: 6,
									overflow: 'hidden',
									textOverflow: 'ellipsis',
									whiteSpace: 'nowrap',
								}}
							>
								<span style={{ opacity: selectedConnector ? 1 : 0.7 }}>
									{selectedConnectorLabel}
								</span>
							</div>
							<span style={{ fontSize: 10, marginLeft: 8, opacity: 0.7 }}>
								{isConnectorDropdownOpen ? '▲' : '▼'}
							</span>
						</div>
					</div>

					<div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
						<div style={{ flex: '0 0 48%', position: 'relative' }}>
							<div style={{ marginBottom: 4 }}>{t('refGenerator.method')}</div>

							<Select
								value={selectedMethodId || undefined}
								options={methodOptions}
								onChange={handleMethodChange}
								placeholder={methodPlaceholder}
								disabled={!selectedConnector || !methods.length}
								sortOptions={false}
							/>
						</div>

						<div style={{ flex: '0 0 52%' }} ref={fieldContainerRef}>
							<div
								style={{
									marginBottom: 4,
									display: 'flex',
									alignItems: 'center',
									gap: 8,
								}}
							>
								<div>{t('refGenerator.field')}</div>
							</div>
							<div style={{ display: 'flex', gap: 0, alignItems: 'stretch' }}>
								{allowResponseTypes.length > 1 ? (
									<div
										className='compactRadioGroup'
										style={{ flexShrink: 0, justifyContent: 'center' }}
									>
										{allowResponseTypes.includes('body') ? (
											<Radio
												checked={responseType === 'body'}
												onChange={() => applyResponseType('body')}
												label={<span style={{ fontSize: 12 }}>B</span>}
											/>
										) : null}
										{allowResponseTypes.includes('header') ? (
											<Radio
												checked={responseType === 'header'}
												onChange={() => applyResponseType('header')}
												label={<span style={{ fontSize: 12 }}>H</span>}
											/>
										) : null}
										{allowResponseTypes.includes('status') ? (
											<Radio
												checked={responseType === 'status'}
												onChange={() => applyResponseType('status')}
												label={<span style={{ fontSize: 12 }}>S</span>}
											/>
										) : null}
									</div>
								) : null}
								<input
								ref={fieldInputRef}
								type='text'
								value={searchValue}
								onChange={(e) => handleFieldInputChange(e.target.value)}
								onFocus={() => {
									if (selectedMethod && responseType !== 'status') {
										const path = searchValue.trim();
										const nextOptions = getReferenceOptions(
											selectedMethod,
											responseType,
											path,
											currentMethodIterators,
											t,
										);
										setFilteredOptions(nextOptions);
										updateDropdownPosition();
									}
								}}
								onBlur={() => {
									setFilteredOptions([]);
									setDropdownPosition(null);
								}}
								placeholder={
									!selectedMethod
										? t('placeholders.selectMethodFirst')
										: responseType === 'status'
										? t('references.responseStatus')
										: t('placeholders.selectField')
								}
								disabled={!selectedMethod || responseType === 'status'}
								style={{
									flex: 1,
									width: '100%',
									padding: '5px 8px',
									fontSize: 12,
									boxSizing: 'border-box',
									border: '1px solid var(--color-border-default)',
									borderRadius: '4px',
									fontFamily: 'inherit',
									backgroundColor: selectedMethod ? 'var(--color-background-surface)' : 'var(--color-background-disabled)',
									minHeight: 32,
									height: 32,
								}}
							/>
							</div>
						</div>
					</div>
				</div>

				<div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
					<Button onClick={onClose}>{t('actions.cancel')}</Button>
					<Button type='primary' onClick={handleApply} disabled={!canInsert}>
						Insert
					</Button>
				</div>
			</div>

			{isDropdownOpen &&
				dropdownPosition &&
				createPortal(
					<div
						ref={fieldDropdownRef}
						style={{
							position: 'absolute',
							top: dropdownPosition.top,
							left: dropdownPosition.left,
							width: dropdownPosition.width,
							maxHeight: 180,
							overflowY: 'auto',
							border: '1px solid var(--color-border-default)',
							borderRadius: 4,
							background: 'var(--color-background-elevated)',
							boxShadow: 'var(--shadow-md)',
							marginTop: 2,
							zIndex: 4000,
							fontSize: 12,
						}}
					>
						{filteredOptions.map((opt) => (
							<div
								key={opt.value}
								onMouseDown={(e) => e.preventDefault()}
								onClick={() => handleOptionClick(opt)}
								style={{
									padding: '4px 6px',
									cursor: 'pointer',
									whiteSpace: 'nowrap',
								}}
							>
								{opt.label}
							</div>
						))}
					</div>,
					document.body,
				)}
			{isConnectorListOpen &&
				connectorDropdownPosition &&
				createPortal(
					<div
						ref={connectorDropdownRef}
						style={{
							position: 'absolute',
							top: connectorDropdownPosition.top,
							left: connectorDropdownPosition.left,
							width: connectorDropdownPosition.width,
							zIndex: 4000,
							marginTop: 2,
							border: '1px solid var(--color-border-default)',
							borderRadius: 4,
							backgroundColor: 'var(--color-background-elevated)',
							boxShadow: 'var(--shadow-md)',
							maxHeight: 220,
							overflowY: 'auto',
							fontSize: 12,
						}}
					>
						{connectorOptions.map((c) => (
							<div
								key={c.value}
								onMouseDown={(e) => {
									e.preventDefault();
									setSelectedConnector(c.value);
									setIsConnectorDropdownOpen(false);
									setSelectedMethodId('');
									setSearchValue('');
									setSelectedOption(null);
									setFilteredOptions([]);
								}}
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: 6,
									padding: '4px 6px',
									cursor: 'pointer',
									whiteSpace: 'nowrap',
									overflow: 'hidden',
									textOverflow: 'ellipsis',
								}}
							>
								<span>{c.label}</span>
							</div>
						))}
					</div>,
					document.body,
				)}
		</>
	);
};

export default ReferenceGenerator;
