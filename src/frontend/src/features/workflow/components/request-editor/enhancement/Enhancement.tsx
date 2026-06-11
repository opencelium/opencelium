import React, { useRef, useState } from 'react';
import { ConfigProvider } from 'antd';
import { Collapse } from '@shared/ui/primitives/Collapse';
import { Empty } from '@shared/ui/primitives/Empty';
import { IconButton } from '@shared/ui/primitives/IconButton';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { useDispatch, useSelector } from 'react-redux';
import { EnhancementArgs } from './Args';
import Description from './Description';
import ScriptLanguage from './Language';
import Script from './Script';
import { updateConnection } from '../../../store/connection/connectionSlice';
import { Language } from '../../../types/connection';
import type { Enhancement } from '../../../types/connection';
import type { RootState } from '../../../store';
import { updateEnhancementInConnection } from '../../../store/connection/utils';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import '../body-editor/bodyLegacy.css';

interface EnhancementProps {
	enhancement?: Enhancement;
	readOnly?: boolean;
}

const ReferenceEnhancement = ({ enhancement, readOnly }: EnhancementProps) => {
	const { t } = useI18n('workflow');
	const dispatch = useDispatch();
	const connection = useSelector((state: RootState) => state.connection.connection);
	const [isScriptMaximized, setIsScriptMaximized] = useState(false);
	const [maximizedStyle, setMaximizedStyle] = useState<React.CSSProperties | undefined>();
	const scriptBoxRef = useRef<HTMLDivElement>(null);

	// Maximize to the dialog body (not the viewport): pin the box to the modal
	// body's rect with position:fixed so it stays in the DOM (ACE isn't remounted),
	// then nudge ACE to re-measure for the new size.
	const toggleScriptMaximized = () => {
		setIsScriptMaximized((prev) => {
			const next = !prev;
			if (next) {
				const body = scriptBoxRef.current?.closest('.ant-modal-body') as HTMLElement | null;
				const rect = body?.getBoundingClientRect();
				setMaximizedStyle(
					rect ? { position: 'fixed', top: rect.top, left: rect.left, width: rect.width, height: rect.height } : undefined,
				);
			}
			return next;
		});
		setTimeout(() => window.dispatchEvent(new Event('resize')), 0);
	};

	if (!connection) return null;

	const hasEnhancement = !!enhancement;

	const onChangeEnhancement = (newEnhancement: Enhancement) => {
		dispatch(updateConnection(updateEnhancementInConnection(connection, { ...newEnhancement })));
	};

	const onChangeLanguage = (newLanguage: Language) => {
		if (hasEnhancement && enhancement) onChangeEnhancement({ ...enhancement, language: newLanguage });
	};

	const onChangeDescription = (newDescription: string) => {
		if (hasEnhancement && enhancement) onChangeEnhancement({ ...enhancement, description: newDescription });
	};

	const onChangeScript = (newScript: string) => {
		if (hasEnhancement && enhancement) onChangeEnhancement({ ...enhancement, script: newScript });
	};

	return (
		<div className='bodyLegacyEnhancementContent'>
			{/* Motion off cascades to the nested Variable Information / Description
			    collapses so toggling them doesn't expand-then-jump like the left pane. */}
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
										defaultActiveKeys={['variableInfo']}
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
									<ScriptLanguage readOnly={readOnly} language={enhancement!.language} onChangeLanguage={onChangeLanguage} />
								</div>
								<div
									ref={scriptBoxRef}
									className={isScriptMaximized ? 'bodyLegacyEnhancementScript bodyLegacyEnhancementScriptMaximized' : 'bodyLegacyEnhancementScript'}
									style={isScriptMaximized ? maximizedStyle : undefined}
								>
									<span className='bodyLegacyScriptToggle'>
										<Tooltip content={t(isScriptMaximized ? 'actions.minimizeScript' : 'actions.maximizeScript')}>
											<IconButton
												iconProps={{ name: isScriptMaximized ? 'minimize' : 'maximize' }}
												size='xs'
												type='text'
												onClick={toggleScriptMaximized}
											/>
										</Tooltip>
									</span>
									<div className='bodyLegacyEnhancementScriptEditor'>
										<Script readOnly={readOnly} enhancement={enhancement!} onChangeScript={onChangeScript} />
									</div>
								</div>
								<div className='bodyLegacyEnhancementDescription'>
									<Description
										readOnly={readOnly}
										description={enhancement.description || ''}
										onChangeDescription={onChangeDescription}
									/>
								</div>
							</div>
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
