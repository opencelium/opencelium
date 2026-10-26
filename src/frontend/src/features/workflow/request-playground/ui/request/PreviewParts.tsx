import type { KeyboardEvent, MouseEvent } from 'react';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { buildTestId } from '@shared/testing/testId';
import type { JsonPart } from '../../model/bodyPreview';

type Props = {
	parts: JsonPart[];
	missingKeys: string[];
	testId: string | undefined;
	onSelect: (key: string) => void;
};

// Renders preview text with every input value as a chip that opens its row in Test values.
export function PreviewParts({ parts, missingKeys, testId, onSelect }: Props) {
	const { t } = useI18n('workflow');
	const renderPart = (part: JsonPart, index: number) => {
		if (part.kind !== 'input') return <span key={index} className={`rpJson-${part.kind}`}>{part.text}</span>;
		const content = part.isMissing
			? <span className='rpJson-placeholder'>{t('requestPlayground.body.setReference')}</span>
			: part.parts.map(renderPart);
		const select = (event: MouseEvent | KeyboardEvent) => {
			event.stopPropagation();
			onSelect(part.key);
		};
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key !== 'Enter' && event.key !== ' ') return;
			event.preventDefault();
			select(event);
		};
		return (
			<span key={index} className={missingKeys.includes(part.key) ? 'rpDynamic rpDynamic--missing' : 'rpDynamic'}
				role='button' tabIndex={0} onClick={select} onKeyDown={onKeyDown} data-testid={buildTestId(testId, part.key)}>
				{content}
			</span>
		);
	};
	return <>{parts.map(renderPart)}</>;
}
