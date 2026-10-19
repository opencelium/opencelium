import { jsonInputLocation } from './jsonInputLocation';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { InputValue } from './playgroundInputs';

type Props = {
	name: string;
	reference: string;
	input: InputValue;
	invalid: boolean;
	onChange: (input: InputValue) => void;
};
export function PlaygroundInput({ name, reference, input, invalid, onChange }: Props) {
	const { t } = useI18n('workflow');
	const jsonLocation = invalid ? jsonInputLocation(input.text) : undefined;

	return (
		<div className="scriptPlaygroundInput">
			<div className="scriptPlaygroundInputHeader">
				<strong>{name}</strong>
				<div
					className="scriptPlaygroundModes"
					role="group"
					data-testid={`script-playground-var-mode-${name}`}
					aria-label={t('sandbox.mode', { name })}
				>
					{(['json', 'text', 'missing'] as const).map((mode) => (
						<button
							key={mode}
							type="button"
							aria-pressed={input.mode === mode}
							data-testid={`script-playground-var-mode-${name}-${mode}`}
							onClick={() => onChange({ ...input, mode })}
						>
							{mode === 'json' ? 'JSON' : t(`sandbox.${mode}`)}
						</button>
					))}
				</div>
			</div>
			<code className="scriptPlaygroundReference">
				<span
					style={{
						backgroundColor: reference.match(/#[\da-fA-F]{6}/)?.[0] ?? '#22b8cf',
					}}
				/>
				{reference}
			</code>
			{input.mode === 'missing' ? (
				<p className="scriptPlaygroundMissing" data-testid={`script-playground-var-${name}`}>
					{t('sandbox.missingHint')}
				</p>
			) : (
				<div className="scriptPlaygroundValueEditor">
					<textarea
						data-testid={`script-playground-var-${name}`}
						aria-label={name}
						aria-invalid={invalid}
						value={input.text}
						onChange={(event) => onChange({ ...input, text: event.target.value })}
						placeholder={t(input.mode === 'json' ? 'sandbox.jsonHint' : 'sandbox.textHint')}
					/>
					{input.mode === 'text' && <small>{t('sandbox.textHint')}</small>}
				</div>
			)}
			{invalid && input.text.trim() && (
				<div role="alert">{t('sandbox.invalidJsonLocation', { name, ...jsonLocation })}</div>
			)}
		</div>
	);
}
