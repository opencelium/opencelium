import { useEffect, useState } from 'react';
import { Input } from 'antd';
import { DebounceDelay } from '../../../../constants/constants';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { EnhancementDescriptionProps } from './EnhancementDescription.types';

const EnhancementDescription = ({
	onChangeDescription,
	description,
	readOnly,
}: EnhancementDescriptionProps) => {
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
		<label className="scriptEnhancementDescription">
			<span>{t('description.label')}</span>
			<Input.TextArea
				readOnly={readOnly}
				rows={3}
				data-testid="workflow-enhancement-description"
				placeholder={t('sandbox.descriptionPlaceholder')}
				value={localValue}
				onChange={(event) => setLocalValue(event.target.value)}
				style={{ resize: 'none' }}
			/>
		</label>
	);
};

export default EnhancementDescription;
