import React, { useEffect, useState } from 'react';
import { DownOutlined, UpOutlined } from '@ant-design/icons';
import { Button, Input } from 'antd';
import { DebounceDelay } from '../../../constants/constants';
import { useI18n } from '@shared/i18n/hooks/useI18n';

interface DescriptionProps {
	description: string;
	onChangeDescription: (newDescription: string) => void;
	readOnly?: boolean;
}

const Description = ({ onChangeDescription, description, readOnly }: DescriptionProps) => {
	const { t } = useI18n('workflow');
	const [showDescription, setShowDescription] = useState(false);
	const [localValue, setLocalValue] = useState(description);

	useEffect(() => {
		setLocalValue(description);
	}, [description]);

	useEffect(() => {
		const timeout = setTimeout(() => {
			if (localValue !== description) onChangeDescription(localValue);
		}, DebounceDelay);

		return () => clearTimeout(timeout);
	}, [description, localValue, onChangeDescription]);

	return (
		<div style={{ borderTop: '1px solid var(--color-border-subtle)', paddingTop: 8 }}>
			<div className='bodyLegacyDescriptionHeader'>
				<b>{t('description.label')}</b>
				<Button
					type="text"
					size="small"
					icon={showDescription ? <UpOutlined /> : <DownOutlined />}
					onClick={() => setShowDescription((p) => !p)}
				/>
			</div>
			{showDescription ? (
				<div style={{ marginTop: 8 }}>
					<Input.TextArea
						readOnly={readOnly}
						rows={9}
						value={localValue}
						onChange={(e) => setLocalValue(e.target.value)}
						style={{ resize: 'none' }}
					/>
				</div>
			) : null}
		</div>
	);
};

export default Description;
