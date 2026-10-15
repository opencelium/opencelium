import { useI18n } from '@shared/i18n/hooks/useI18n';
import { formatParsedArgPath } from '../components/request-editor/utils/parseEnhancementArg';
import type { MethodTestInputs } from './collectMethodReferences';
import { TestMethodInputRow, type TestMethodInputRowHandlers } from './TestMethodInputRow';
import { EMPTY_INPUT, referenceInputKey, webhookInputKey, type TestInputValue } from './testMethodInputValue';

type Props = TestMethodInputRowHandlers & {
	inputs: MethodTestInputs;
	values: Record<string, TestInputValue>;
	resolvingKeys: string[];
	missingKeys: string[];
	// Only this input is shown; the request on the right picks it.
	selectedKey: string | null;
};

export function TestMethodInputs({ inputs, values, resolvingKeys, missingKeys, selectedKey, ...handlers }: Props) {
	const { t } = useI18n('workflow');
	const references = inputs.references.filter((reference) => referenceInputKey(reference) === selectedKey);
	const webhooks = inputs.webhooks.filter((webhook) => webhookInputKey(webhook) === selectedKey);
	const rowProps = (key: string) => ({
		inputKey: key,
		value: values[key] ?? EMPTY_INPUT,
		isResolving: resolvingKeys.includes(key),
		isMissing: missingKeys.includes(key),
		...handlers,
	});

	return (
		<div className='testMethodPane' data-testid='workflow-test-method-inputs'>
			<p className='testMethodDescription'>{t('testMethod.inputs.hint')}</p>
			{references.length > 0 && (
				<section className='testMethodGroup'>
					<div className='testMethodGroupTitle'>{t('testMethod.inputs.references')}</div>
					{references.map((reference) => (
						<TestMethodInputRow key={reference.reference} {...rowProps(referenceInputKey(reference))}
							targets={reference.targets}
							source={{
								color: reference.parsed.color,
								prefix: t('testMethod.inputs.from'),
								label: reference.sourceMethod
									? reference.sourceMethod.label || reference.sourceMethod.name
									: t('testMethod.inputs.unknownMethod'),
								path: formatParsedArgPath(reference.parsed),
							}} />
					))}
				</section>
			)}
			{webhooks.length > 0 && (
				<section className='testMethodGroup'>
					<div className='testMethodGroupTitle'>{t('testMethod.inputs.webhooks')}</div>
					{webhooks.map((webhook) => (
						<TestMethodInputRow key={webhook.name} {...rowProps(webhookInputKey(webhook))}
							targets={webhook.targets}
							source={{ prefix: t('testMethod.inputs.fromWebhook'), label: webhook.name, path: webhook.type }} />
					))}
				</section>
			)}
		</div>
	);
}
