import { useTheme } from '@shared/theme/hooks/useTheme';
import { useCallback, useState } from 'react';
import { ConfigProvider } from 'antd';
import { EnhancementHeader } from './EnhancementHeader';
import { EnhancementDetails } from './EnhancementDetails';
import { Collapse } from '@shared/ui/primitives/Collapse';
import { Empty } from '@shared/ui/primitives/Empty';
import { Icon } from '@shared/ui/primitives/Icon';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { useMethodContext } from '../../../../providers/MethodContext';
import DirectReferenceInfo from '../DirectReferenceInfo/DirectReferenceInfo';
import { ScriptDebugValue } from '../ScriptDebugValue/ScriptDebugValue';
import { useScriptDebugValue } from '../ScriptDebugValue/useScriptDebugValue';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { EnhancementProps } from './Enhancement.types';
import { useEnhancementState } from './useEnhancementState';
import { countEnhancementReferences } from '../../body-editor/bodyReference';
import '../../body-editor/bodyLegacy.css';

const ReferenceEnhancement = ({
	enhancement,
	readOnly,
	directReference,
	onCreateEnhancement,
	onDeleteEnhancement,
	onPlaygroundOpenChange,
}: EnhancementProps) => {
	const { t } = useI18n('workflow');
	const { themeMode } = useTheme();
	const [playgroundOpen, setPlaygroundOpen] = useState(false);
	const state = useEnhancementState(enhancement);
	const { method: currentMethod } = useMethodContext();
	const debug = useScriptDebugValue(enhancement, state.connection, currentMethod);
	// Stable identity: EnhancementScript debounces on this callback, and an
	// inline arrow here re-armed that debounce on every render.
	const handleChangeScript = useCallback(
		(script: string) => {
			state.onChangeScript(script);
			debug.markStale();
		},
		[state, debug],
	);

	if (!state.connection) return null;

	const hasEnhancement = !!enhancement;
	const canDelete = hasEnhancement && countEnhancementReferences(enhancement) <= 1;

	return (
		<div
			className={`bodyLegacyEnhancementContent scriptEnhancement--${themeMode} ${playgroundOpen ? 'bodyLegacyEnhancementContent--playground' : ''}`}
		>
			<ConfigProvider theme={{ token: { motion: false } }}>
				<Collapse
					className="bodyLegacyEnhancementCollapse"
					defaultActiveKeys={['enhancement']}
					items={[
						{
							key: 'enhancement',
							label: (
								<EnhancementHeader
									canDelete={canDelete}
									onToggleMaximized={hasEnhancement ? state.toggleScriptMaximized : undefined}
									maximized={state.isScriptMaximized}
									readOnly={readOnly}
									onDelete={hasEnhancement ? onDeleteEnhancement : undefined}
									playgroundOpen={playgroundOpen}
									onTogglePlayground={
										enhancement?.language === 'js'
											? () => {
													if (debug.isOpen) debug.toggle();
													setPlaygroundOpen(!playgroundOpen);
													onPlaygroundOpenChange?.(!playgroundOpen);
												}
											: undefined
									}
								>
									{!debug.isAvailable && (
										<Tooltip content={t('enhancement.debugValue.errorNotPaused')}>
											<button
												type="button"
												data-testid="workflow-script-debug-unavailable"
												className="scriptDebugTrigger"
												disabled
												aria-label={t('enhancement.debugValue.show')}
											>
												<Icon name="eye" size={14} />
											</button>
										</Tooltip>
									)}
									{debug.isAvailable && (
										<Tooltip
											content={t(
												debug.isOpen
													? 'enhancement.debugValue.hide'
													: 'enhancement.debugValue.show',
											)}
										>
											<button
												type='button'
												className={
													debug.isOpen
														? 'scriptDebugTrigger scriptDebugTrigger--active'
														: 'scriptDebugTrigger'
												}
												onClick={(event) => {
													event.stopPropagation();
													debug.toggle();
												}}
												aria-label={t(
													debug.isOpen
														? 'enhancement.debugValue.hide'
														: 'enhancement.debugValue.show',
												)}
											>
												<Icon name={debug.isOpen ? 'eye-off' : 'eye'} size={14} />
											</button>
										</Tooltip>
									)}
								</EnhancementHeader>
							),
							showArrow: false,
							content: hasEnhancement ? (
								debug.isOpen ? (
									<div className="bodyLegacyEnhancementBody">
										<ScriptDebugValue
											isOpen={debug.isOpen}
											status={debug.status}
											snapshot={debug.snapshot}
										/>
									</div>
								) : (
									<EnhancementDetails
										key={enhancement!.enhanceId}
										enhancement={enhancement!}
										readOnly={readOnly}
										state={state}
										onChangeScript={handleChangeScript}
										playgroundOpen={playgroundOpen}
										onClosePlayground={() => {
											setPlaygroundOpen(false);
											onPlaygroundOpenChange?.(false);
										}}
									/>
								)
							) : directReference ? (
								<DirectReferenceInfo
									directReference={directReference}
									readOnly={readOnly}
									onCreate={() => onCreateEnhancement?.()}
								/>
							) : (
								<div className="bodyLegacyEnhancementEmpty">
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
