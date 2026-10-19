import { useState } from 'react';
import { jsonInputLocation } from './jsonInputLocation';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Button } from '@shared/ui/primitives/Button';
import { Collapse } from '@shared/ui/primitives/Collapse';
import { Textarea } from '@shared/ui/primitives/Textarea';
import { PlaygroundInputSummary } from './PlaygroundInputSummary';
import { PlaygroundJsonEditor } from './PlaygroundJsonEditor';
import { PlaygroundReference } from './PlaygroundReference';
import type { ParsedArgEntry } from '../EnhancementArgs/EnhancementArgs.types';
import type { InputMode, InputValue } from './playgroundInputs';

type Props = {
	name: string;
	reference: string;
	entry?: ParsedArgEntry;
	input: InputValue;
	isInvalid: boolean;
	onChange: (input: InputValue) => void;
};

const modes: InputMode[] = ['json', 'text', 'missing'];

export function PlaygroundInput({ name, reference, entry, input, isInvalid, onChange }: Props) {
	const { t } = useI18n('workflow');
	const [isOpen, setOpen] = useState(false);
	const jsonLocation = jsonInputLocation(input.text);
	const hasJsonError = isInvalid && input.text.trim() !== '';
	const errorText = t('sandbox.invalidJsonLocation', { name, ...jsonLocation });
	const label = (
		<span className="scriptPlaygroundInputLabel">
			<strong>{name}</strong>
			<PlaygroundReference reference={reference} entry={entry} />
			{!isOpen && <PlaygroundInputSummary name={name} input={input} />}
		</span>
	);
	const content = (
		<>
			<div
				className="scriptPlaygroundModes"
				role="group"
				data-testid={`script-playground-var-mode-${name}`}
				aria-label={t('sandbox.mode', { name })}
			>
				{modes.map((mode) => (
					<Button
						key={mode}
						type={input.mode === mode ? 'primary' : 'text'}
						testId={`script-playground-var-mode-${name}-${mode}`}
						onClick={() => onChange({ ...input, mode })}
					>
						{mode === 'json' ? 'JSON' : t(`sandbox.${mode}`)}
					</Button>
				))}
			</div>
			{input.mode === 'missing' ? (
				<p className="scriptPlaygroundMissing" data-testid={`script-playground-var-${name}`}>
					{t('sandbox.missingHint')}
				</p>
			) : input.mode === 'json' ? (
				<PlaygroundJsonEditor
					name={name}
					value={input.text}
					placeholder={t('sandbox.jsonHint')}
					error={hasJsonError ? { ...jsonLocation, message: errorText } : undefined}
					onChange={(text) => onChange({ ...input, text })}
				/>
			) : (
				<div className="scriptPlaygroundValueEditor">
					<Textarea
						testId={`script-playground-var-${name}`}
						value={input.text}
						onChange={(event) => onChange({ ...input, text: event.target.value })}
						placeholder={t('sandbox.textHint')}
					/>
				</div>
			)}
			{hasJsonError && (
				<div className="scriptPlaygroundInputError" role="alert">
					{errorText}
				</div>
			)}
		</>
	);

	return (
		<Collapse
			className="scriptPlaygroundInput"
			activeKeys={isOpen ? [name] : []}
			onChange={(keys) => setOpen(keys.includes(name))}
			items={[{ key: name, label, content, testId: `script-playground-var-toggle-${name}` }]}
		/>
	);
}
