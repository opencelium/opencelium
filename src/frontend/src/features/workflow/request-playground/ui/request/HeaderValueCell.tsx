import { Input } from '@shared/ui/primitives/Input';
import { buildTextPreview, firstInputKey } from '../../model/bodyPreview';
import type { PreviewInput } from '../../model/previewRequest';
import { ReferenceValuePreview } from './ReferenceValuePreview';

type Props = {
	value: string;
	previewInputs: PreviewInput[];
	missingKeys: string[];
	placeholder: string;
	testId: string | undefined;
	onSelectInput: (key: string) => void;
	onChange: (value: string) => void;
};

export function HeaderValueCell({ value, previewInputs, missingKeys, placeholder, testId, onSelectInput, onChange }: Props) {
	const parts = buildTextPreview(value, previewInputs);
	const inputKey = firstInputKey(parts);

	if (inputKey === undefined) {
		return (
			<Input value={value} className='rpMonoInput' testId={testId} placeholder={placeholder}
				onChange={(event) => onChange(event.target.value)} />
		);
	}
	return <ReferenceValuePreview parts={parts} inputKey={inputKey} missingKeys={missingKeys} testId={testId}
		onSelectInput={onSelectInput} />;
}
