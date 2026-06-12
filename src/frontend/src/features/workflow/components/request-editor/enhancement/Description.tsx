import React, { useEffect, useState } from 'react';
import { Input } from 'antd';
import { Collapse } from '@shared/ui/primitives/Collapse';
import { DebounceDelay } from '../../../constants/constants';
import { useI18n } from '@shared/i18n/hooks/useI18n';

interface DescriptionProps {
	description: string;
	onChangeDescription: (newDescription: string) => void;
	readOnly?: boolean;
}

const Description = ({ onChangeDescription, description, readOnly }: DescriptionProps) => {
	const { t } = useI18n('workflow');
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
		<Collapse
			className='bodyLegacyDescriptionCollapse'
			items={[
				{
					key: 'description',
					label: t('description.label'),
					content: (
						<Input.TextArea
							readOnly={readOnly}
							rows={9}
							value={localValue}
							onChange={(e) => setLocalValue(e.target.value)}
							style={{ resize: 'none' }}
						/>
					),
				},
			]}
		/>
	);
};

export default Description;
