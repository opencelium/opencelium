import type { JsonPart } from '../../model/bodyPreview';
import { PreviewParts } from './PreviewParts';

type Props = {
	parts: JsonPart[];
	inputKey: string;
	missingKeys: string[];
	testId: string | undefined;
	onSelectInput: (key: string) => void;
};

// A table value that holds references, never shown as raw reference text.
export function ReferenceValuePreview({ parts, inputKey, missingKeys, testId, onSelectInput }: Props) {
	return (
		<div className='rpValuePreview' data-testid={testId} onClick={() => onSelectInput(inputKey)}>
			<PreviewParts parts={parts} missingKeys={missingKeys} testId={testId} onSelect={onSelectInput} />
		</div>
	);
}
