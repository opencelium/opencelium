import React, { useState } from 'react';
import { ExpandAltOutlined } from '@ant-design/icons';
import { Button, Modal, Typography } from 'antd';
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
	const [isScriptDialogOpen, setIsScriptDialogOpen] = useState(false);

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
			<div className='bodyLegacyEnhancementTop'>
				<div className='bodyLegacyEnhancementTitleWrap'>
					<b className='bodyLegacyEnhancementTitle'>{t('enhancement.title')}</b>
				</div>
				{hasEnhancement ? (
					<Button type="primary" icon={<ExpandAltOutlined />} onClick={() => setIsScriptDialogOpen(true)}>
						{t('actions.openScriptNewWindow')}
					</Button>
				) : null}
			</div>

			{hasEnhancement ? (
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
					<Typography.Text type="secondary">
						{t('enhancement.emptyState')}
					</Typography.Text>
				</div>
			)}

			{hasEnhancement && (
				<Modal
					open={isScriptDialogOpen}
					onCancel={() => setIsScriptDialogOpen(false)}
					width="90vw"
					title={t('enhancement.title')}
					footer={[
						<Button key="close" type="primary" onClick={() => setIsScriptDialogOpen(false)}>
							{t('actions.ok')}
						</Button>,
					]}
				>
					<div style={{ height: '70vh', display: 'flex', flexDirection: 'column', gap: 16 }}>
						<EnhancementArgs enhancement={enhancement!} />
						<ScriptLanguage readOnly={readOnly} language={enhancement!.language} onChangeLanguage={onChangeLanguage} />
						<div style={{ flex: 1, minHeight: 0 }}>
							<Script readOnly={readOnly} enhancement={enhancement!} onChangeScript={onChangeScript} />
						</div>
					</div>
				</Modal>
			)}
		</div>
	);
};

export default ReferenceEnhancement;
