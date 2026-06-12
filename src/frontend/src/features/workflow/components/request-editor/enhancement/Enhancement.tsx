import React from 'react';
import { Collapse } from '@shared/ui/primitives/Collapse';
import { Empty } from '@shared/ui/primitives/Empty';
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
									<EnhancementArgs enhancement={enhancement!} />
								</div>
								<div className='bodyLegacyEnhancementLabel'>{t('enhancement.language')}</div>
								<div className='bodyLegacyEnhancementLanguage'>
									<ScriptLanguage readOnly={readOnly} language={enhancement!.language} onChangeLanguage={onChangeLanguage} />
								</div>
								<div className='bodyLegacyEnhancementScript'>
									<Script readOnly={readOnly} enhancement={enhancement!} onChangeScript={onChangeScript} />
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
		</div>
	);
};

export default ReferenceEnhancement;
