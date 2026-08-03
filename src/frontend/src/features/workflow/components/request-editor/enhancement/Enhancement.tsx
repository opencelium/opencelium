import React, { useRef, useState } from 'react';
import { ConfigProvider } from 'antd';
import { Maximize2, Minimize2 } from 'lucide-react';
import { DeleteIconButton } from '@shared/ui/actions/DeleteIconButton';
import { Collapse } from '@shared/ui/primitives/Collapse';
import { Empty } from '@shared/ui/primitives/Empty';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { useConfirm } from '@shared/ui/confirm/ConfirmDialogContext';
import { useDispatch, useSelector } from 'react-redux';
import { EnhancementArgs } from './Args';
import Description from './Description';
import DirectReferenceInfo from './DirectReferenceInfo';
import ScriptLanguage from './Language';
import Script from './Script';
import { updateConnection } from '../../../store/connection/connectionSlice';
import { Language } from '../../../types/connection';
import type { Enhancement } from '../../../types/connection';
import type { RootState } from '../../../store';
import type { DirectReferenceInfo as DirectReferenceInfoData } from '../body-editor/bodyBinding';
import { updateEnhancementInConnection } from '../../../store/connection/utils';
import { countEnhancementReferences } from '../body-editor/bodyReference';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import '../body-editor/bodyLegacy.css';

interface EnhancementProps {
	enhancement?: Enhancement;
	readOnly?: boolean;
	directReference?: DirectReferenceInfoData | null;
	onCreateEnhancement?: () => void;
	onDeleteEnhancement?: () => void;
}

const ReferenceEnhancement = ({ enhancement, readOnly, directReference, onCreateEnhancement, onDeleteEnhancement }: EnhancementProps) => {
	const { t } = useI18n('workflow');
	const confirm = useConfirm();
	const dispatch = useDispatch();
	const connection = useSelector((state: RootState) => state.connection.connection);
	const [isScriptMaximized, setIsScriptMaximized] = useState(false);
	const [maximizedStyle, setMaximizedStyle] = useState<React.CSSProperties | undefined>();
	const scriptBoxRef = useRef<HTMLDivElement>(null);

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
	const canDeleteEnhancement = hasEnhancement && countEnhancementReferences(enhancement) <= 1;

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
			<ConfigProvider theme={{ token: { motion: false } }}>
			<Collapse
				className='bodyLegacyEnhancementCollapse'
				defaultActiveKeys={['enhancement']}
				items={[
					{
						key: 'enhancement',
						label: (
							<div className='bodyLegacyEnhancementHeader'>
								<span>{t('enhancement.title')}</span>
								{hasEnhancement && onDeleteEnhancement ? (
									<span
										onClick={async (event) => {
											event.stopPropagation();
											const ok = await confirm({
												title: t('enhancement.confirmDelete.title'),
												message: t('enhancement.confirmDelete.message'),
											});
											if (!ok) return;
											onDeleteEnhancement();
										}}
									>
										<Tooltip content={t(canDeleteEnhancement ? 'actions.deleteEnhancement' : 'enhancement.deleteDisabledMultipleReferences')}>
											<DeleteIconButton
												iconSize={15}
												disabled={readOnly || !canDeleteEnhancement}
												testId='workflow-enhancement-delete'
											/>
										</Tooltip>
									</span>
								) : null}
							</div>
						),
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
									<ScriptLanguage readOnly={readOnly} language={enhancement!.language} onChangeLanguage={onChangeLanguage} />
								</div>
								<div
									ref={scriptBoxRef}
									className={isScriptMaximized ? 'bodyLegacyEnhancementScript bodyLegacyEnhancementScriptMaximized' : 'bodyLegacyEnhancementScript'}
									style={isScriptMaximized ? maximizedStyle : undefined}
								>
									<div className='bodyLegacyEnhancementLabel'>{t('enhancement.script')}</div>
									<div className='bodyLegacyEnhancementScriptEditor'>
										<span className='bodyLegacyScriptToggle'>
											<Tooltip content={t(isScriptMaximized ? 'actions.minimizeScript' : 'actions.maximizeScript')}>
												<button
													type='button'
													className='logsHeaderIconButton logsHeaderIconButton--active'
													onClick={toggleScriptMaximized}
													aria-label={t(isScriptMaximized ? 'actions.minimizeScript' : 'actions.maximizeScript')}
												>
													{isScriptMaximized ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
												</button>
											</Tooltip>
										</span>
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
