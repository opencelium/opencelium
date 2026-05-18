import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { DownOutlined, LinkOutlined, SettingOutlined, UpOutlined } from '@ant-design/icons';
import { Button, Input, Modal, Typography } from 'antd';
import type {
	Connection,
	EndpointArg,
	MethodWithId,
	QueryParam,
} from '../../../types/connection';
import ReferenceGenerator from '../reference-generator/ReferenceGenerator';
import ReferenceEnhancement from '../enhancement/Enhancement';
import { ReferenceInfoSection } from '../reference-info/ReferenceInfoSection';
import { ReferenceItem } from '../../../core/references/components/enhancemen/ReferenceItem';
import {
	sanitizePlainTextPaste,
	sanitizeUrlInputValue,
	shouldBlockUrlKeyInput,
} from './urlEditor.utils';

type Props = {
	open: boolean;
	readOnly?: boolean;
	connection: Connection;
	currentMethod: MethodWithId;
	param: QueryParam;
	endpointArgs: Record<string, EndpointArg>;
	onChangeKey: (nextKey: string) => void;
	onChangeValue: (nextValue: string) => void;
	onClose: () => void;
	onRequestOpenReferenceGenerator?: () => void;
	isReferenceGeneratorOpen?: boolean;
	onCloseReferenceGenerator?: () => void;
	onApplyReference?: (reference: string) => void;
	valueEditorNode: React.ReactNode;
	onDeleteValueRefArgId?: (argId: string, nextValue: string) => void;
};

const ARG_TOKEN_ANY_RE = /(#{%\s*([A-Za-z0-9_-]+)\s*%})/g;

function extractArgIdsInOrder(value?: string | null): string[] {
	const v = value || '';
	const ids: string[] = [];
	ARG_TOKEN_ANY_RE.lastIndex = 0;
	let m: RegExpExecArray | null;
	while ((m = ARG_TOKEN_ANY_RE.exec(v))) if (m[2]) ids.push(m[2]);
	return ids;
}

function extractSuffixForDisplay(value?: string | null): string {
	const v = value || '';
	const nonTokens = v.replace(ARG_TOKEN_ANY_RE, '');
	return (nonTokens || '').replace(/[^&]/g, '');
}

function removeOneTokenById(value: string, argId: string): string {
	const re = new RegExp(String.raw`#{%\s*${argId}\s*%}`);
	return (value || '').replace(re, '');
}

const panelStyle: React.CSSProperties = {
	border: '1px solid #f0f0f0',
	borderRadius: 12,
	background: '#fff',
	overflow: 'hidden',
};

export const UrlParamApiEditorDialog: React.FC<Props> = ({
	open,
	readOnly,
	connection,
	currentMethod,
	param,
	endpointArgs,
	onChangeKey,
	onChangeValue,
	onClose,
	onRequestOpenReferenceGenerator,
	isReferenceGeneratorOpen = false,
	onCloseReferenceGenerator,
	onApplyReference,
	valueEditorNode,
	onDeleteValueRefArgId,
}) => {
	const [showData, setShowData] = useState(true);
	const [selectedEnhanceId, setSelectedEnhanceId] = useState<string | undefined>();

	const valueTokenIds = useMemo(() => extractArgIdsInOrder(param.value), [param.value]);
	const endpointArgsForValue = useMemo(() => {
		const out: Record<string, EndpointArg> = {};
		for (const id of valueTokenIds) {
			const arg = endpointArgs?.[id];
			if (arg) out[id] = arg;
		}
		return out;
	}, [endpointArgs, valueTokenIds]);

	useEffect(() => {
		if (selectedEnhanceId && !valueTokenIds.includes(selectedEnhanceId)) {
			setSelectedEnhanceId(undefined);
		}
	}, [selectedEnhanceId, valueTokenIds]);

	const currentEnhancement = useMemo(
		() => (selectedEnhanceId ? endpointArgsForValue?.[selectedEnhanceId]?.enhancement : undefined),
		[endpointArgsForValue, selectedEnhanceId],
	);

	const valueSuffixForDisplay = useMemo(() => extractSuffixForDisplay(param.value), [param.value]);
	const hasAnyValueReferences = valueTokenIds.length > 0;

	const handleDeleteValueRef = useCallback(
		(argId: string) => {
			const curr = param.value || '';
			const withoutOne = removeOneTokenById(curr, argId);
			const nextIds = extractArgIdsInOrder(withoutOne);
			const nextSuffix = extractSuffixForDisplay(withoutOne);
			const nextValue = `${nextIds.map((id) => `#{%${id}%}`).join('')}${nextSuffix}`;
			onChangeValue(nextValue);
			onDeleteValueRefArgId?.(argId, nextValue);
		},
		[onChangeValue, onDeleteValueRefArgId, param.value],
	);

	return (
		<Modal
			open={open}
			onCancel={onClose}
			width="92vw"
			style={{ top: 24 }}
			styles={{ body: { height: '86vh', overflow: 'hidden' } }}
			title="Query param editor"
			footer={[
				<Button key="close" type="primary" onClick={onClose}>
					Close
				</Button>,
			]}
		>
			<div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 48%', gap: 20, height: '100%' }}>
				<div style={{ display: 'flex', flexDirection: 'column', gap: '2%', minHeight: 0 }}>
					<ReferenceInfoSection
						messageProperty={'endpoint' as any}
						data={{ param, currentMethod, connection, endpointArgs: endpointArgsForValue }}
						onReferenceClick={(id: string) => setSelectedEnhanceId(id)}
					/>

					<div style={{ ...panelStyle, flex: showData ? '1 1 70%' : '0 0 auto', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
						<div
							style={{
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'space-between',
								padding: 12,
								borderBottom: '1px solid #f0f0f0',
								background: '#fafafa',
							}}
						>
							<Typography.Title level={5} style={{ margin: 0 }}>
								Data
							</Typography.Title>
							<Button
								type="text"
								size="small"
								icon={showData ? <UpOutlined /> : <DownOutlined />}
								onClick={() => setShowData((p) => !p)}
							/>
						</div>

						{showData ? (
							<div style={{ position: 'relative', height: '100%', minHeight: 0 }}>
								<div style={{ overflowY: 'auto', height: '100%', padding: 16, paddingBottom: isReferenceGeneratorOpen ? 140 : 16 }}>
									<div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
										<div>
											<Typography.Text type="secondary">Key</Typography.Text>
											<Input
												value={param.key}
												disabled={!!readOnly}
												size="large"
												onChange={(e) => onChangeKey(sanitizeUrlInputValue(e.target.value))}
												onKeyDown={(e) => {
													if (shouldBlockUrlKeyInput(e.key)) e.preventDefault();
												}}
												onPaste={(e) => {
													const original = e.clipboardData?.getData('text/plain') || '';
													const pasted = sanitizeUrlInputValue(sanitizePlainTextPaste(original));
													if (pasted === original) return;
													e.preventDefault();
													onChangeKey(sanitizeUrlInputValue(`${param.key}${pasted}`));
												}}
												style={{ marginTop: 6 }}
											/>
										</div>

										<div>
											<Typography.Text type="secondary">Value</Typography.Text>
											<div style={{ marginTop: 6 }}>
												{hasAnyValueReferences ? (
													<div
														style={{
															border: '1px solid #d9d9d9',
															borderRadius: 8,
															padding: 8,
															minHeight: 42,
															display: 'flex',
															alignItems: 'center',
															flexWrap: 'wrap',
															gap: 8,
															backgroundColor: readOnly ? '#fafafa' : '#fff',
														}}
													>
														<Button
															type="text"
															size="small"
															icon={<SettingOutlined />}
															onClick={() => {
																const pick = valueTokenIds[valueTokenIds.length - 1];
																if (pick) setSelectedEnhanceId(pick);
															}}
															style={{ marginRight: -8 }}
														/>

														{valueTokenIds.map((argId) => {
															const src = endpointArgsForValue?.[argId]?.source;
															if (!src) return null;
															return (
																<ReferenceItem
																	key={argId}
																	argKey={argId}
																	value={src}
																	readOnly={readOnly}
																	onDelete={() => handleDeleteValueRef(argId)}
																/>
															);
														})}

														{valueSuffixForDisplay ? (
															<span style={{ marginLeft: 4, fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace', opacity: 0.85 }}>
																{valueSuffixForDisplay}
															</span>
														) : null}
													</div>
												) : (
													valueEditorNode
												)}
											</div>

											{!readOnly ? (
												<Button
													style={{ marginTop: 12 }}
													icon={<LinkOutlined />}
													onClick={() => onRequestOpenReferenceGenerator?.()}
												>
													Insert Reference
												</Button>
											) : null}
										</div>
									</div>
								</div>

								{!readOnly && isReferenceGeneratorOpen ? (
									<div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', zIndex: 10000 }}>
										<ReferenceGenerator
											open
											connection={connection}
											currentMethod={currentMethod}
											allowResponseTypes={['body', 'header', 'status']}
											onClose={() => (onCloseReferenceGenerator ? onCloseReferenceGenerator() : undefined)}
											onApply={(r: string) => onApplyReference?.(r)}
										/>
									</div>
								) : null}
							</div>
						) : null}
					</div>
				</div>

				<div className='bodyLegacyEnhancement'>
					<ReferenceEnhancement readOnly={readOnly} enhancement={currentEnhancement} />
				</div>
			</div>
		</Modal>
	);
};
