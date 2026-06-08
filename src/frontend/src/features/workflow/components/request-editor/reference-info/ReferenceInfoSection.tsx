import React, { useState } from 'react';
import { DownOutlined, UpOutlined } from '@ant-design/icons';
import { Button, Card } from 'antd';
import { useSelector } from 'react-redux';
import { ReferenceInfo } from './ReferenceInfo';
import type { MessageProperty } from '../shared/messageProperty';
import type { RootState } from '../../../store';
import { useI18n } from '@shared/i18n/hooks/useI18n';

interface ReferenceInfoProps {
	messageProperty: MessageProperty;
	data: any;
	onReferenceClick?: (enhanceId: string) => void;
}

export const ReferenceInfoSection: React.FC<ReferenceInfoProps> = ({
	messageProperty,
	data,
	onReferenceClick,
}) => {
	const { t } = useI18n('workflow');
	const [showReference, setShowReference] = useState(true);
	const connection = useSelector((state: RootState) => state.connection.connection);

	if (!connection) return null;

	return (
		<Card
			size="small"
			style={{
				flex: showReference ? '0 0 25%' : '0 0 auto',
				maxHeight: showReference ? '25%' : 'none',
				overflow: 'hidden',
				borderRadius: 12,
			}}
			title={t('referenceInfo.title')}
			extra={
				<Button
					type="text"
					size="small"
					icon={showReference ? <UpOutlined /> : <DownOutlined />}
					onClick={() => setShowReference((p) => !p)}
				/>
			}
			styles={{ body: { padding: showReference ? 16 : 0, overflow: 'auto', maxHeight: 200 } }}
		>
			{showReference ? (
				<ReferenceInfo
					messageProperty={messageProperty}
					data={data}
					onReferenceClick={onReferenceClick}
				/>
			) : null}
		</Card>
	);
};
