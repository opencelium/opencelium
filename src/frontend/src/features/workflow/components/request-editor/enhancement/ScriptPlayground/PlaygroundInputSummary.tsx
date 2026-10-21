import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Icon } from '@shared/ui/primitives/Icon';
import type { InputValue } from './playgroundInputs';

const PREVIEW_LENGTH = 40;

const preview = (text: string) => {
	const compact = text.replace(/\s+/g, ' ').trim();
	return compact.length > PREVIEW_LENGTH ? `${compact.slice(0, PREVIEW_LENGTH)}…` : compact;
};

export function PlaygroundInputSummary({ name, input }: { name: string; input: InputValue }) {
	const { t } = useI18n('workflow');
	if (input.mode === 'missing') return null;
	const isEmpty = input.text.trim() === '';
	return (
		<span
			className={`scriptPlaygroundInputSummary ${isEmpty ? 'scriptPlaygroundInputSummary--empty' : ''}`}
			data-testid={`script-playground-var-summary-${name}`}
		>
			{isEmpty ? (
				<>
					<Icon name="edit" size={12} color="inherit" />
					{t('sandbox.setValueHint')}
				</>
			) : (
				<code>{input.mode === 'text' ? `"${preview(input.text)}"` : preview(input.text)}</code>
			)}
		</span>
	);
}
