import React from 'react';
import { Button } from 'antd';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../../store';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { DirectReferenceInfoProps } from './DirectReferenceInfo.types';

const DirectReferenceInfo: React.FC<DirectReferenceInfoProps> = ({ directReference, readOnly, onCreate }) => {
	const { t } = useI18n('workflow');
	const methods = useSelector((state: RootState) => state.connection.connection?.fromConnector.method || []);

	const getMethodLabel = (color: string) => {
		const method = methods.find((item) => item.color.toLowerCase() === color.toLowerCase());
		return method?.label || method?.name || color;
	};

	return (
		<div className='bodyLegacyDirectReference'>
			<div className='bodyLegacyDirectReferenceTitle'>{t('enhancement.directReference.title')}</div>
			<div className='bodyLegacyDirectReferenceDescription'>
				{t(directReference.refs.length > 1 ? 'enhancement.directReference.descriptionMany' : 'enhancement.directReference.description')}
			</div>
			<div className='bodyLegacyDirectReferenceMap'>
				<span className='bodyLegacyDirectReferenceField'>{directReference.leftField}</span>
				<span className='bodyLegacyDirectReferenceArrow'>&larr;</span>
				<div className='bodyLegacyDirectReferenceRefs'>
					{directReference.refs.map((ref, index) => (
						<span key={index} className='bodyLegacyDirectReferenceRef'>
							<span
								className='bodyLegacyDirectReferenceBadge'
								style={{ backgroundColor: ref.color }}
							>
								{getMethodLabel(ref.color)}
							</span>
							<span className='bodyLegacyDirectReferenceField' style={{ color: ref.color }}>
								{`${ref.color}.(${ref.type}).${ref.field}`}
							</span>
						</span>
					))}
				</div>
			</div>
			<Button
				type='primary'
				disabled={readOnly}
				onClick={onCreate}
				data-testid='workflow-enhancement-create'
				className='bodyLegacyDirectReferenceCreateButton'
			>
				{t('actions.createEnhancement')}
			</Button>
		</div>
	);
};

export default DirectReferenceInfo;
