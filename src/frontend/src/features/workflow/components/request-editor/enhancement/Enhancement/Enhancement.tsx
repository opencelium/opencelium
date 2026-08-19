import { ConfigProvider } from 'antd';
import { Maximize2, Minimize2 } from 'lucide-react';
import { DeleteIconButton } from '@shared/ui/actions/DeleteIconButton';
import { Collapse } from '@shared/ui/primitives/Collapse';
import { Empty } from '@shared/ui/primitives/Empty';
import { Icon } from '@shared/ui/primitives/Icon';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { useConfirm } from '@shared/ui/confirm/ConfirmDialogContext';
import { useMethodContext } from '../../../../providers/MethodContext';
import { EnhancementArgs } from '../EnhancementArgs/EnhancementArgs';
import EnhancementDescription from '../EnhancementDescription/EnhancementDescription';
import DirectReferenceInfo from '../DirectReferenceInfo/DirectReferenceInfo';
import ScriptLanguage from '../ScriptLanguage/ScriptLanguage';
import EnhancementScript from '../EnhancementScript/EnhancementScript';
import { ScriptDebugValue } from '../ScriptDebugValue/ScriptDebugValue';
import { useScriptDebugValue } from '../ScriptDebugValue/useScriptDebugValue';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { EnhancementProps } from './Enhancement.types';
import { useEnhancementState } from './useEnhancementState';
import { countEnhancementReferences } from '../../body-editor/bodyReference';
import '../../body-editor/bodyLegacy.css';

const ReferenceEnhancement = ({ enhancement, readOnly, directReference,
	onCreateEnhancement, onDeleteEnhancement }: EnhancementProps) => {
	const { t } = useI18n('workflow');
	const confirm = useConfirm();
	const state = useEnhancementState(enhancement);
	const { method: currentMethod } = useMethodContext();
	const debug = useScriptDebugValue(enhancement, state.connection, currentMethod);

	if (!state.connection) return null;

	const hasEnhancement = !!enhancement;
	const canDelete = hasEnhancement && countEnhancementReferences(enhancement) <= 1;

	return (
		<div className='bodyLegacyEnhancementContent'>
			<ConfigProvider theme={{ token: { motion: false } }}>
			<Collapse
				className='bodyLegacyEnhancementCollapse'
				defaultActiveKeys={['enhancement']}
				items={[
					{
						key: 'enhancement',
						label: <div className='bodyLegacyEnhancementHeader'>
							<span>{t('enhancement.title')}</span>
							{hasEnhancement && <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
								<Tooltip content={t(debug.isOpen ? 'enhancement.debugValue.hide' : 'enhancement.debugValue.show')}>
									<button
										type='button'
										className={debug.isOpen ? 'scriptDebugTrigger scriptDebugTrigger--active' : 'scriptDebugTrigger'}
										onClick={(event) => {
											event.stopPropagation();
											debug.toggle();
										}}
										aria-label={t(debug.isOpen ? 'enhancement.debugValue.hide' : 'enhancement.debugValue.show')}
									>
										<Icon name={debug.isOpen ? 'eye-off' : 'eye'} size={14} />
									</button>
								</Tooltip>
								{onDeleteEnhancement && <span onClick={async (event) => {
									event.stopPropagation();
									const ok = await confirm({ title: t('enhancement.confirmDelete.title'),
										message: t('enhancement.confirmDelete.message') });
									if (ok) onDeleteEnhancement();
								}}>
									<Tooltip content={t(canDelete ? 'actions.deleteEnhancement'
										: 'enhancement.deleteDisabledMultipleReferences')}>
										<DeleteIconButton iconSize={15} disabled={readOnly || !canDelete}
											testId='workflow-enhancement-delete' />
									</Tooltip>
								</span>}
							</span>}
						</div>,
						showArrow: false,
						content: hasEnhancement ? (
							debug.isOpen ? (
								<div className='bodyLegacyEnhancementBody'>
									<ScriptDebugValue
										isOpen={debug.isOpen}
										status={debug.status}
										snapshot={debug.snapshot}
									/>
								</div>
							) : (
							<div className='bodyLegacyEnhancementBody'>
								<div className='bodyLegacyEnhancementArgs'>
									<Collapse
										defaultActiveKeys={[]}
										items={[
											{
												key: 'variableInfo',
												label: t('args.sectionTitle'),
												content: <EnhancementArgs enhancement={enhancement!} />,
											},
										]}
									/>
								</div>
								<div className='bodyLegacyEnhancementLabel'>{t('enhancement.language')}</div>
								<div className='bodyLegacyEnhancementLanguage'>
									<ScriptLanguage readOnly={readOnly} language={enhancement!.language} onChangeLanguage={state.onChangeLanguage} />
								</div>
								<div
									ref={state.scriptBoxRef}
									className={state.isScriptMaximized ? 'bodyLegacyEnhancementScript bodyLegacyEnhancementScriptMaximized' : 'bodyLegacyEnhancementScript'}
									style={state.isScriptMaximized ? state.maximizedStyle : undefined}
								>
									<div className='bodyLegacyEnhancementLabel'>{t('enhancement.script')}</div>
									<div className='bodyLegacyEnhancementScriptEditor'>
										<span className='bodyLegacyScriptToggle'>
											<Tooltip content={t(state.isScriptMaximized ? 'actions.minimizeScript' : 'actions.maximizeScript')}>
												<button
													type='button'
													className='logsHeaderIconButton logsHeaderIconButton--active'
													onClick={state.toggleScriptMaximized}
													aria-label={t(state.isScriptMaximized ? 'actions.minimizeScript' : 'actions.maximizeScript')}
												>
													{state.isScriptMaximized ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
												</button>
											</Tooltip>
										</span>
										<EnhancementScript readOnly={readOnly} enhancement={enhancement!} onChangeScript={(script) => {
											state.onChangeScript(script);
											debug.markStale();
										}} />
									</div>
								</div>
								<div className='bodyLegacyEnhancementDescription'>
				<EnhancementDescription
										readOnly={readOnly}
										description={enhancement.description || ''}
										onChangeDescription={state.onChangeDescription}
									/>
								</div>
							</div>
							)
						) : directReference ? (
							<DirectReferenceInfo
								directReference={directReference}
								readOnly={readOnly}
								onCreate={() => onCreateEnhancement?.()}
							/>
						) : (
							<div className='bodyLegacyEnhancementEmpty'>
								<Empty description={t('enhancement.emptyState')} />
							</div>
						),
					},
				]}
			/>
			</ConfigProvider>
		</div>
	);
};

export default ReferenceEnhancement;
