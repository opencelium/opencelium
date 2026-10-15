import { useI18n } from '@shared/i18n/hooks/useI18n';
import { buildTestId } from '@shared/testing/testId';
import { Button } from '@shared/ui/primitives/Button';
import { Loading } from '@shared/ui/primitives/Loading/Loading';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { MethodColorDot } from '../components/MethodColorDot/MethodColorDot';
import type { MethodReferenceTarget } from './collectMethodReferences';
import { TestMethodValueEditor } from './TestMethodValueEditor';
import type { TestInputSource, TestInputValue } from './testMethodInputValue';

// A typed or empty value needs no badge: the editor already shows it.
type LabelledSource = Extract<TestInputSource, 'live' | 'stored' | 'sample'>;
const isLabelledSource = (source: TestInputSource): source is LabelledSource =>
	source === 'live' || source === 'stored' || source === 'sample';

export type TestMethodInputRowHandlers = {
	onTextChange: (key: string, text: string) => void;
	onToggleKind: (key: string) => void;
};

type Props = TestMethodInputRowHandlers & {
	inputKey: string;
	value: TestInputValue;
	isResolving: boolean;
	isMissing: boolean;
	targets: MethodReferenceTarget[];
	source: { color?: string; prefix: string; label: string; path: string };
};

export function TestMethodInputRow({ inputKey, value, isResolving, isMissing, targets, source,
	onTextChange, onToggleKind }: Props) {
	const { t } = useI18n('workflow');
	const testId = (part: string) => buildTestId('workflow-test-method-input', inputKey, part);

	return (
		<div className='testMethodRow' data-testid={testId('row')}>
			<div className='testMethodRowHeader'>
				<span className='testMethodTargets' data-testid={testId('targets')}>
					{targets.map(({ location, property }) => (
						<span key={`${location}:${property ?? ''}`} className='testMethodTarget'>
							<span className='testMethodTag'>{t(`testMethod.location.${location}`)}</span>
							{property && <span className='testMethodTargetProperty' title={property}>{property}</span>}
						</span>
					))}
				</span>
				<span className='testMethodRowSpacer' />
				{isResolving && <Loading size='xs' inline />}
				{!isResolving && isLabelledSource(value.source) && (
					<Tooltip content={t(`testMethod.sourceHint.${value.source}`)}>
						<span className={`testMethodSource testMethodSource--${value.source}`} data-testid={testId('source-tag')}>
							{t(`testMethod.source.${value.source}`)}
						</span>
					</Tooltip>
				)}
				<Tooltip content={t(value.kind === 'string' ? 'testMethod.kind.stringHint' : 'testMethod.kind.jsonHint')}>
					<Button type='text' onClick={() => onToggleKind(inputKey)} testId={testId('kind')}
						className='testMethodKindToggle'>
						{t(value.kind === 'string' ? 'testMethod.kind.string' : 'testMethod.kind.json')}
					</Button>
				</Tooltip>
			</div>
			<div className='testMethodRowSource' data-testid={testId('source')}>
				<span>{source.prefix}</span>
				{source.color && <MethodColorDot color={source.color} size={10} />}
				<span className='testMethodRowLabel'>{source.label}</span>
				<span className='testMethodRowPath' title={source.path}>{source.path}</span>
			</div>
			<TestMethodValueEditor value={value} isMissing={isMissing} testId={testId('value')}
				onChange={(text) => onTextChange(inputKey, text)} />
		</div>
	);
}
