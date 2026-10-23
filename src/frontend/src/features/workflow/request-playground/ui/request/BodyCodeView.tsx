import type { JsonLine, LineEdit } from '../../model/bodyPreview';
import { BodyCodeLine } from './BodyCodeLine';

type Props = {
	lines: JsonLine[];
	missingKeys: string[];
	testId: string;
	onSelect: (key: string) => void;
	onEditValue: (edit: LineEdit, text: string) => void;
};

// The body with its test values filled in; plain values edit in place, input values open Test values.
export function BodyCodeView({ lines, missingKeys, testId, onSelect, onEditValue }: Props) {
	return (
		<div className='rpCodeView' data-testid={testId}>
			{lines.map((line, index) => (
				<BodyCodeLine key={index} line={line} number={index + 1} missingKeys={missingKeys} testId={testId}
					onSelectInput={onSelect} onEditValue={onEditValue} />
			))}
		</div>
	);
}
