import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from 'antd';
import type { Connection, MethodWithId } from '../../../types/connection';
import {
	buildReferenceValue,
	getReferenceOptions,
	isExpandableReferencePath,
	type ResponseType,
} from '../body-editor/requestReferenceOptions';

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
	const [selectedConnector, setSelectedConnector] = useState<string>('');
	const [isConnectorDropdownOpen, setIsConnectorDropdownOpen] =
		useState<boolean>(false);

	const [selectedMethodId, setSelectedMethodId] = useState<string>('');
	const [isMethodDropdownOpen, setIsMethodDropdownOpen] =
		useState<boolean>(false);

	const [searchValue, setSearchValue] = useState<string>('');
	const [selectedOption, setSelectedOption] = useState<OptionType | null>(null);
	const [filteredOptions, setFilteredOptions] = useState<OptionType[]>([]);
	const [responseType, setResponseType] = useState<ResponseType>(
		allowResponseTypes[0] ?? 'body',
	);

	const fieldContainerRef = useRef<HTMLDivElement | null>(null);
	const fieldDropdownRef = useRef<HTMLDivElement | null>(null);
	const fieldInputRef = useRef<HTMLInputElement | null>(null);
	const methodSelectRef = useRef<HTMLDivElement | null>(null);
	const connectorSelectRef = useRef<HTMLDivElement | null>(null);
	const methodDropdownRef = useRef<HTMLDivElement | null>(null);
	const connectorDropdownRef = useRef<HTMLDivElement | null>(null);

	const [dropdownPosition, setDropdownPosition] = useState<{
		top: number;
		left: number;
		width: number;
	} | null>(null);
	const [methodDropdownPosition, setMethodDropdownPosition] = useState<{
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
			const title = method.connector.title;
			if (seen.has(title)) return options;
			seen.add(title);
			options.push({ label: title, value: title });
			return options;
		}, []);
	}, [eligibleMethods]);

	const methods = useMemo(
		() =>
			selectedConnector
				? eligibleMethods.filter((method) => method.connector.title === selectedConnector)
				: [],
		[eligibleMethods, selectedConnector],
	);

	const selectedMethod: MethodWithId | undefined = useMemo(
		() => methods.find((m) => m.id === selectedMethodId),
		[methods, selectedMethodId],
	);

	useEffect(() => {
		if (!open) {
			setSelectedConnector('');
			setIsConnectorDropdownOpen(false);

			setSelectedMethodId('');
			setIsMethodDropdownOpen(false);

			setResponseType(allowResponseTypes[0] ?? 'body');
			setSearchValue('');
			setSelectedOption(null);
			setFilteredOptions([]);
			setDropdownPosition(null);
			setMethodDropdownPosition(null);
			setConnectorDropdownPosition(null);
		}
	}, [open]);

	useEffect(() => {
		if (!open) return;

		setSelectedConnector('');
		setIsConnectorDropdownOpen(false);

		setSelectedMethodId('');
		setIsMethodDropdownOpen(false);

		setResponseType(allowResponseTypes[0] ?? 'body');
		setSearchValue('');
		setSelectedOption(null);
		setFilteredOptions([]);
		setDropdownPosition(null);
		setMethodDropdownPosition(null);
		setConnectorDropdownPosition(null);

		requestAnimationFrame(() => {
			try {
				(
					fieldContainerRef.current?.querySelector(
						'input',
					) as HTMLInputElement | null
				)?.focus?.();
			} catch {
				//
			}
		});
	}, [resetKey, open]);

	useEffect(() => {
		if (!selectedMethod) {
			setSearchValue('');
			setSelectedOption(null);
			setFilteredOptions([]);
			setDropdownPosition(null);
			setMethodDropdownPosition(null);
			return;
		}

		if (responseType === 'status') {
			setSearchValue('Response Status');
			setSelectedOption({ label: 'Response Status', value: 'status' });
			setFilteredOptions([]);
			setDropdownPosition(null);
			setMethodDropdownPosition(null);
			return;
		}

		setSearchValue('');
		setSelectedOption(null);
		const nextOptions = getReferenceOptions(selectedMethod, responseType, '');
		setFilteredOptions(nextOptions);
		setDropdownPosition(null);
		setMethodDropdownPosition(null);
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
	const updateMethodDropdownPosition = () => {
		if (!methodSelectRef.current) return;

		const rect = methodSelectRef.current.getBoundingClientRect();
		setMethodDropdownPosition({
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
	const isMethodListOpen =
		isMethodDropdownOpen && methods.length > 0 && !!selectedConnector;
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
		if (!isMethodListOpen) {
			setMethodDropdownPosition(null);
			return;
		}

		updateMethodDropdownPosition();

		const handleScroll = () => updateMethodDropdownPosition();
		const handleResize = () => updateMethodDropdownPosition();

		window.addEventListener('scroll', handleScroll, true);
		window.addEventListener('resize', handleResize);

		return () => {
			window.removeEventListener('scroll', handleScroll, true);
			window.removeEventListener('resize', handleResize);
		};
	}, [isMethodListOpen]);
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
			setFilteredOptions(getReferenceOptions(selectedMethod, responseType, ''));
			return;
		}

		const baseOptions = getReferenceOptions(selectedMethod, responseType, value);
		const term = value.toLowerCase();

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
			const nextOptions = getReferenceOptions(selectedMethod, nextType, '');
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

		if (isExpandableReferencePath(selectedMethod, responseType, opt.value)) {
			const nextOptions = getReferenceOptions(selectedMethod, responseType, opt.value);
			setFilteredOptions(nextOptions);
			return;
		}
		setFilteredOptions([]);
	};

	useEffect(() => {
		if (!isMethodDropdownOpen && !isConnectorDropdownOpen) return;

		const handleClickOutside = (e: MouseEvent) => {
			const target = e.target as Node;

			const inMethod =
				methodSelectRef.current && methodSelectRef.current.contains(target);
			const inConnector =
				connectorSelectRef.current &&
				connectorSelectRef.current.contains(target);
			const inMethodDropdown =
				methodDropdownRef.current && methodDropdownRef.current.contains(target);
			const inConnectorDropdown =
				connectorDropdownRef.current &&
				connectorDropdownRef.current.contains(target);

			if (!inMethod && !inMethodDropdown) setIsMethodDropdownOpen(false);
			if (!inConnector && !inConnectorDropdown)
				setIsConnectorDropdownOpen(false);
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [isMethodDropdownOpen, isConnectorDropdownOpen]);

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

	const getMethodLabel = (m: MethodWithId) =>
		m.label || m.name || (m as any).index || m.id;

	const selectedMethodLabel = selectedMethod
		? getMethodLabel(selectedMethod)
		: methods.length
			? 'Select method...'
			: 'No previous methods';

	const selectedConnectorLabel = selectedConnector || 'Select connector...';

	return (
		<>
			<div
				style={{
					marginTop: 8,
					padding: 8,
					border: '1px solid #ddd',
					borderRadius: 4,
					background: '#fafafa',
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
						<div style={{ marginBottom: 4 }}>Connector</div>

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
								border: '1px solid #ccc',
								borderRadius: 4,
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'space-between',
								backgroundColor: '#fff',
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
						<div
							style={{ flex: '0 0 48%', position: 'relative' }}
							ref={methodSelectRef}
						>
							<div style={{ marginBottom: 4 }}>Method</div>

							<div
								onClick={() => {
									if (!selectedConnector) return;
									if (!methods.length) return;
									setIsMethodDropdownOpen((prev) => !prev);
								}}
								style={{
									width: '100%',
									padding: '5px 8px',
									fontSize: 12,
									minHeight: 32,
									height: 32,
									boxSizing: 'border-box',
									border: '1px solid #ccc',
									borderRadius: 4,
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'space-between',
									backgroundColor:
										selectedConnector && methods.length ? '#fff' : '#f5f5f5',
									cursor:
										selectedConnector && methods.length
											? 'pointer'
											: 'not-allowed',
									opacity: selectedConnector ? 1 : 0.6,
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
									{selectedMethod && (
										<span
											style={{
												display: 'inline-block',
												width: 10,
												height: 10,
												borderRadius: '50%',
												backgroundColor: selectedMethod.color,
											}}
										/>
									)}
									<span style={{ opacity: selectedMethod ? 1 : 0.7 }}>
										{selectedMethodLabel}
									</span>
								</div>
								<span style={{ fontSize: 10, marginLeft: 8, opacity: 0.7 }}>
									{isMethodDropdownOpen ? '▲' : '▼'}
								</span>
							</div>
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
								<div>Field</div>
							</div>
							<div style={{ display: 'flex', gap: 6, alignItems: 'stretch' }}>
								{allowResponseTypes.length > 1 ? (
									<div
										style={{
											display: 'flex',
											flexDirection: 'column',
											gap: 3,
											flexShrink: 0,
											minWidth: 30,
											height: 40,
											justifyContent: 'flex-start',
											paddingTop: 0,
											paddingBottom: 0,
										}}
									>
										{allowResponseTypes.includes('body') ? (
											<label
												style={{
													display: 'flex',
													alignItems: 'center',
													justifyContent: 'space-between',
													gap: 4,
													cursor: 'pointer',
													lineHeight: 1,
													minHeight: 11,
												}}
											>
												<span style={{ fontSize: 12 }}>B</span>
												<input
													type='radio'
													checked={responseType === 'body'}
													onChange={() => applyResponseType('body')}
												/>
											</label>
										) : null}
										{allowResponseTypes.includes('header') ? (
											<label
												style={{
													display: 'flex',
													alignItems: 'center',
													justifyContent: 'space-between',
													gap: 4,
													cursor: 'pointer',
													lineHeight: 1,
													minHeight: 11,
												}}
											>
												<span style={{ fontSize: 12 }}>H</span>
												<input
													type='radio'
													checked={responseType === 'header'}
													onChange={() => applyResponseType('header')}
												/>
											</label>
										) : null}
										{allowResponseTypes.includes('status') ? (
											<label
												style={{
													display: 'flex',
													alignItems: 'center',
													justifyContent: 'space-between',
													gap: 4,
													cursor: 'pointer',
													lineHeight: 1,
													minHeight: 11,
												}}
											>
												<span style={{ fontSize: 12 }}>S</span>
												<input
													type='radio'
													checked={responseType === 'status'}
													onChange={() => applyResponseType('status')}
												/>
											</label>
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
										? 'Select method first'
										: responseType === 'status'
										? 'Response Status'
										: 'Select Field...'
								}
								disabled={!selectedMethod || responseType === 'status'}
								style={{
									flex: 1,
									width: '100%',
									padding: '5px 8px',
									fontSize: 12,
									boxSizing: 'border-box',
									border: '1px solid rgb(204, 204, 204)',
									borderRadius: '4px',
									fontFamily: 'inherit',
									backgroundColor: selectedMethod ? '#fff' : '#f5f5f5',
									minHeight: 32,
									height: 32,
								}}
							/>
							</div>
						</div>
					</div>
				</div>

				<div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
					<Button onClick={onClose}>Cancel</Button>
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
							border: '1px solid #ccc',
							borderRadius: 4,
							background: '#fff',
							boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
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
			{isMethodListOpen &&
				methodDropdownPosition &&
				createPortal(
					<div
						ref={methodDropdownRef}
						style={{
							position: 'absolute',
							top: methodDropdownPosition.top,
							left: methodDropdownPosition.left,
							width: methodDropdownPosition.width,
							zIndex: 4000,
							marginTop: 2,
							border: '1px solid #ccc',
							borderRadius: 4,
							backgroundColor: '#fff',
							boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
							maxHeight: 220,
							overflowY: 'auto',
							fontSize: 12,
						}}
					>
						{methods.map((m) => (
							<div
								key={m.id}
								onMouseDown={(e) => {
									e.preventDefault();
									setSelectedMethodId(m.id);
									setIsMethodDropdownOpen(false);
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
								<span
									style={{
										display: 'inline-block',
										width: 10,
										height: 10,
										borderRadius: '50%',
										backgroundColor: m.color,
										flexShrink: 0,
									}}
								/>
								<span>{getMethodLabel(m)}</span>
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
							border: '1px solid #ccc',
							borderRadius: 4,
							backgroundColor: '#fff',
							boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
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
