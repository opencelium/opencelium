import { useState, type KeyboardEvent } from 'react';
import { Input } from '@shared/ui/primitives/Input';
import { toEditText } from '../../model/bodyEdit';
import type { JsonLine, LineEdit } from '../../model/bodyPreview';
import { PreviewParts } from './PreviewParts';

type Props = {
	line: JsonLine;
	number: number;
	missingKeys: string[];
	testId: string;
	onSelectInput: (key: string) => void;
	onEditValue: (edit: LineEdit, text: string) => void;
};

// One line of the body; a scalar value turns into an input on click, input chips open Test values.
export function BodyCodeLine({ line, number, missingKeys, testId, onSelectInput, onEditValue }: Props) {
	const [draft, setDraft] = useState<string | null>(null);
	const { edit, parts } = line;
	const partsProps = { missingKeys, testId, onSelect: onSelectInput };
	const start = () => edit && setDraft(toEditText(edit.raw));
	const commit = () => {
		if (edit && draft !== null && draft !== toEditText(edit.raw)) onEditValue(edit, draft);
		setDraft(null);
	};
	const onKeyDown = (event: KeyboardEvent) => {
		if (event.key === 'Enter') commit();
		if (event.key === 'Escape') {
			event.stopPropagation();
			setDraft(null);
		}
	};

	const renderValue = (lineEdit: LineEdit) => {
		const valueParts = parts.slice(lineEdit.prefixLength, lineEdit.hasComma ? -1 : undefined);
		return (
			<>
				<PreviewParts parts={parts.slice(0, lineEdit.prefixLength)} {...partsProps} />
				{draft !== null
					? <span className='rpInlineEdit'>
						<Input value={draft} autoFocus className='rpMonoInput' testId={`${testId}-edit-${number}`}
							onChange={(event) => setDraft(event.target.value)} onBlur={commit} onKeyDown={onKeyDown} />
					</span>
					: <span className='rpEditableValue' role='button' tabIndex={0} onClick={start}
						onKeyDown={(event) => event.key === 'Enter' && start()}>
						<PreviewParts parts={valueParts} {...partsProps} />
					</span>}
				{lineEdit.hasComma && <span className='rpJson-syntax'>,</span>}
			</>
		);
	};

	return (
		<div className='rpCodeLine'>
			<span className='rpCodeLineNo'>{number}</span>
			<span className='rpCodeLineText' style={{ paddingInlineStart: `${line.depth * 2}ch` }}>
				{edit ? renderValue(edit) : <PreviewParts parts={parts} {...partsProps} />}
			</span>
		</div>
	);
}
