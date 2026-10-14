import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Alert } from '@shared/ui/primitives/Alert';
import { Hint } from '@shared/ui/primitives/Hint';
import { formatParsedArgPath } from '../components/request-editor/utils/parseEnhancementArg';
import type { MethodTestInputs } from './collectMethodReferences';
import { TestMethodInputRow, type TestMethodInputRowHandlers } from './TestMethodInputRow';
import { EMPTY_INPUT, referenceInputKey, webhookInputKey, type TestInputValue } from './testMethodInputValue';

type Props = TestMethodInputRowHandlers & {
	inputs: MethodTestInputs;
	values: Record<string, TestInputValue>;
	resolvingKeys: string[];
	missingKeys: string[];
	verb: string;
	endpoint: string;
};

export function TestMethodInputs({ inputs, values, resolvingKeys, missingKeys, verb, endpoint, ...handlers }: Props) {
	const { t } = useI18n('workflow');
	const hasInputs = inputs.references.length > 0 || inputs.webhooks.length > 0;
	const rowProps = (key: string) => ({
		inputKey: key,
		value: values[key] ?? EMPTY_INPUT,
		isResolving: resolvingKeys.includes(key),
		isMissing: missingKeys.includes(key),
		...handlers,
	});

	return (
		<div className='testMethodPane' data-testid='workflow-test-method-inputs'>
			<div className='testMethodRequestLine'>
				<span className='testMethodVerb'>{verb.toUpperCase()}</span>
				<span className='testMethodEndpoint' title={endpoint}>{endpoint}</span>
			</div>
			{!hasInputs && <Hint noPrefix>{t('testMethod.inputs.none')}</Hint>}
			{hasInputs && <Hint noPrefix>{t('testMethod.inputs.hint')}</Hint>}
			{missingKeys.length > 0 && (
				<Alert type='warning' showIcon message={t('testMethod.inputs.missing', { count: missingKeys.length })} />
			)}
			{inputs.references.length > 0 && (
				<section className='testMethodGroup'>
					<div className='testMethodGroupTitle'>{t('testMethod.inputs.references')}</div>
					{inputs.references.map((reference) => (
						<TestMethodInputRow key={reference.reference} {...rowProps(referenceInputKey(reference))}
							color={reference.parsed.color}
							label={reference.sourceMethod
								? reference.sourceMethod.label || reference.sourceMethod.name
								: t('testMethod.inputs.unknownMethod')}
							path={formatParsedArgPath(reference.parsed)}
							locations={reference.locations} />
					))}
				</section>
			)}
			{inputs.webhooks.length > 0 && (
				<section className='testMethodGroup'>
					<div className='testMethodGroupTitle'>{t('testMethod.inputs.webhooks')}</div>
					{inputs.webhooks.map((webhook) => (
						<TestMethodInputRow key={webhook.name} {...rowProps(webhookInputKey(webhook))}
							label={webhook.name} path={webhook.type} locations={webhook.locations} />
					))}
				</section>
			)}
		</div>
	);
}
