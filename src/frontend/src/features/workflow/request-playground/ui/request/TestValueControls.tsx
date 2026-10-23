import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Button } from '@shared/ui/primitives/Button';
import { Input } from '@shared/ui/primitives/Input';
import { Loading } from '@shared/ui/primitives/Loading/Loading';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { readJsonError, type InputValue } from '../../model/playgroundValues';
import { JsonValueEditor } from './JsonValueEditor';

type InputControlProps = {
	value: InputValue;
	isResolving: boolean;
	isMissing: boolean;
	testId?: string;
	onChange: (text: string) => void;
};

// A JSON value gets a code editor; a text value a single line.
export function InputValueControl({ value, isResolving, isMissing, testId, onChange }: InputControlProps) {
	const { t } = useI18n('workflow');
	if (isResolving) return <Loading size='xs' inline />;
	const jsonError = readJsonError(value);
	const placeholder = t(value.source === 'upstream'
		? 'requestPlayground.values.upstreamPlaceholder' : 'requestPlayground.values.placeholder');
	const isError = isMissing || jsonError !== null;
	return (
		<div className='rpValueInput'>
			{value.kind === 'json'
				? <JsonValueEditor value={value.text} isError={isError} testId={testId} placeholder={placeholder}
					onChange={onChange} />
				: <Input value={value.text} error={isError} testId={testId} placeholder={placeholder}
					className='rpMonoInput' onChange={(event) => onChange(event.target.value)} />}
			{jsonError !== null && <span className='rpValueError'>{t('requestPlayground.values.invalidJson')}</span>}
		</div>
	);
}

export function KindToggle({ value, testId, onToggle }: { value: InputValue; testId?: string; onToggle: () => void }) {
	const { t } = useI18n('workflow');
	const isString = value.kind === 'string';
	return (
		<Tooltip content={t(isString ? 'requestPlayground.values.kind.stringHint' : 'requestPlayground.values.kind.jsonHint')}>
			<span className='rpKindToggle'>
				<Button type='text' onClick={onToggle} testId={testId}>
					{t(isString ? 'requestPlayground.values.kind.string' : 'requestPlayground.values.kind.json')}
				</Button>
			</span>
		</Tooltip>
	);
}

type ConnectionControlProps = {
	value: string;
	isSecret: boolean;
	testId?: string;
	onChange: (text: string) => void;
};

// A secret stays masked and read-only: the backend fills it in from the connection.
export function ConnectionValueControl({ value, isSecret, testId, onChange }: ConnectionControlProps) {
	const { t } = useI18n('workflow');
	return (
		<Input value={value} type={isSecret ? 'password' : 'text'} readOnly={isSecret} testId={testId}
			placeholder={t('requestPlayground.values.connectionPlaceholder')}
			className='rpMonoInput' onChange={(event) => onChange(event.target.value)} />
	);
}
