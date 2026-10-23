import { useState, type KeyboardEvent } from 'react';
import { Input } from '@shared/ui/primitives/Input';
import { buildTextPreview, hasInputPart } from '../../model/bodyPreview';
import type { PreviewInput } from '../../model/previewRequest';
import { PreviewParts } from './PreviewParts';

type Props = {
	value: string;
	previewInputs: PreviewInput[];
	missingKeys: string[];
	placeholder: string;
	testId: string | undefined;
	onSelectInput: (key: string) => void;
	onChange: (value: string) => void;
};

// A value with references shows them as in the Body tab; clicking beside a chip edits the raw text.
export function HeaderValueCell({ value, previewInputs, missingKeys, placeholder, testId, onSelectInput, onChange }: Props) {
	const [isEditing, setIsEditing] = useState(false);
	const parts = buildTextPreview(value, previewInputs);

	if (isEditing || !hasInputPart(parts)) {
		return (
			<Input value={value} className='rpMonoInput' testId={testId} placeholder={placeholder} autoFocus={isEditing}
				onBlur={() => setIsEditing(false)} onChange={(event) => onChange(event.target.value)} />
		);
	}

	const onKeyDown = (event: KeyboardEvent) => {
		if (event.key !== 'Enter') return;
		event.preventDefault();
		setIsEditing(true);
	};
	return (
		<div className='rpValuePreview' role='textbox' tabIndex={0} data-testid={testId}
			onClick={() => setIsEditing(true)} onKeyDown={onKeyDown}>
			<PreviewParts parts={parts} missingKeys={missingKeys} testId={testId} onSelect={onSelectInput} />
		</div>
	);
}
