import { useCallback, useState } from 'react';
import { ConfigProvider } from 'antd';
import { EnhancementHeader } from './EnhancementHeader';
import { EnhancementDetails } from './EnhancementDetails';
import { Collapse } from '@shared/ui/primitives/Collapse';
import { Empty } from '@shared/ui/primitives/Empty';
import { IconButton } from '@shared/ui/primitives/IconButton';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { useMethodContext } from '../../../../providers/MethodContext';
import DirectReferenceInfo from '../DirectReferenceInfo/DirectReferenceInfo';
import { ScriptDebugValue } from '../ScriptDebugValue/ScriptDebugValue';
import { useScriptDebugValue } from '../ScriptDebugValue/useScriptDebugValue';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { EnhancementProps } from './Enhancement.types';
import { useEnhancementState } from './useEnhancementState';
import { useScriptVersions } from '@features/ai-assistant/hooks/useScriptVersions';
import { countEnhancementReferences } from '../../body-editor/bodyReference';
import '../../body-editor/bodyLegacy.css';

const ReferenceEnhancement = ({
	enhancement,
	readOnly,
	directReference,
	onCreateEnhancement,
	onDeleteEnhancement,
	isPlaygroundOpen: controlledPlaygroundOpen,
	onPlaygroundOpenChange,
}: EnhancementProps) => {
	const { t } = useI18n('workflow');
	const [localPlaygroundOpen, setLocalPlaygroundOpen] = useState(false);
	const isPlaygroundOpen = controlledPlaygroundOpen ?? localPlaygroundOpen;
	const setPlaygroundOpen = (isOpen: boolean) => {
		setLocalPlaygroundOpen(isOpen);
		onPlaygroundOpenChange?.(isOpen);
	};
	const state = useEnhancementState(enhancement);
	// Held here, not in the details pane: the debug view swaps that pane out and would drop the history.
	const scriptVersions = useScriptVersions(enhancement?.enhanceId);
	const { containerRef, isMaximized, maximizedStyle, toggleMaximized } = state;
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
			ref={containerRef}
			style={isMaximized ? maximizedStyle : undefined}
			className={`bodyLegacyEnhancementContent ${isPlaygroundOpen ? 'bodyLegacyEnhancementContent--playground' : ''} ${isMaximized ? 'bodyLegacyEnhancementMaximized' : ''}`}
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
									onToggleMaximized={hasEnhancement ? toggleMaximized : undefined}
									isMaximized={isMaximized}
									readOnly={readOnly}
									onDelete={hasEnhancement ? onDeleteEnhancement : undefined}
									isPlaygroundOpen={isPlaygroundOpen}
									onTogglePlayground={
										enhancement?.language === 'js'
											? () => {
													if (debug.isOpen) debug.toggle();
													setPlaygroundOpen(!isPlaygroundOpen);
												}
											: undefined
									}
								>
									{!debug.isAvailable && (
										<Tooltip content={t('enhancement.debugValue.errorNotPaused')}>
											<IconButton
												type="text"
												size="xs"
												disabled
												testId="workflow-script-debug-unavailable"
												iconProps={{ name: 'eye', color: 'inherit' }}
											/>
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
											<IconButton
												type="text"
												size="xs"
												testId="workflow-script-debug-toggle"
												className={debug.isOpen ? 'scriptHeaderAction--active' : undefined}
												iconProps={{
													name: debug.isOpen ? 'eye-off' : 'eye',
													color: debug.isOpen ? 'primary' : 'inherit',
												}}
												onClick={debug.toggle}
											/>
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
										isPlaygroundOpen={isPlaygroundOpen}
										onOpenPlayground={() => setPlaygroundOpen(true)}
										scriptVersions={scriptVersions}
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
