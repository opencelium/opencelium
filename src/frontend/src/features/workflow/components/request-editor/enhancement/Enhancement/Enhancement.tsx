import { ConfigProvider } from 'antd';
import { Collapse } from '@shared/ui/primitives/Collapse';
import { Empty } from '@shared/ui/primitives/Empty';
import DirectReferenceInfo from '../DirectReferenceInfo/DirectReferenceInfo';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { EnhancementProps } from './Enhancement.types';
import { useEnhancementState } from './useEnhancementState';
import { countEnhancementReferences } from '../../body-editor/bodyReference';
import { EnhancementHeader } from './EnhancementHeader';
import { EnhancementDetails } from './EnhancementDetails';
import '../../body-editor/bodyLegacy.css';

const ReferenceEnhancement = ({ enhancement, readOnly, directReference,
	onCreateEnhancement, onDeleteEnhancement }: EnhancementProps) => {
	const { t } = useI18n('workflow');
	const state = useEnhancementState(enhancement);

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
						label: <EnhancementHeader canDelete={canDelete} readOnly={readOnly}
							onDelete={hasEnhancement ? onDeleteEnhancement : undefined} />,
						showArrow: false,
						content: hasEnhancement ? (
							<EnhancementDetails enhancement={enhancement!} readOnly={readOnly} state={state} />
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
