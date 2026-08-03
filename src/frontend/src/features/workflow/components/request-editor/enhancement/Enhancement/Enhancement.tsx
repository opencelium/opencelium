import { ConfigProvider } from 'antd';
import { Maximize2, Minimize2 } from 'lucide-react';
import { Collapse } from '@shared/ui/primitives/Collapse';
import { Empty } from '@shared/ui/primitives/Empty';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { EnhancementArgs } from '../EnhancementArgs/EnhancementArgs';
import EnhancementDescription from '../EnhancementDescription/EnhancementDescription';
import DirectReferenceInfo from '../DirectReferenceInfo/DirectReferenceInfo';
import ScriptLanguage from '../ScriptLanguage/ScriptLanguage';
import EnhancementScript from '../EnhancementScript/EnhancementScript';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { EnhancementProps } from './Enhancement.types';
import { useEnhancementState } from './useEnhancementState';
import '../../body-editor/bodyLegacy.css';

const ReferenceEnhancement = ({ enhancement, readOnly, directReference, onCreateEnhancement }: EnhancementProps) => {
	const { t } = useI18n('workflow');
	const state = useEnhancementState(enhancement);

	if (!state.connection) return null;

	const hasEnhancement = !!enhancement;

	return (
		<div className='bodyLegacyEnhancementContent'>
			<ConfigProvider theme={{ token: { motion: false } }}>
			<Collapse
				className='bodyLegacyEnhancementCollapse'
				defaultActiveKeys={['enhancement']}
				items={[
					{
						key: 'enhancement',
						label: t('enhancement.title'),
						showArrow: false,
						content: hasEnhancement ? (
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
										<EnhancementScript readOnly={readOnly} enhancement={enhancement!} onChangeScript={state.onChangeScript} />
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
