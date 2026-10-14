import { useI18n } from '@shared/i18n/hooks/useI18n';
import { buildTestId } from '@shared/testing/testId';
import { Button } from '@shared/ui/primitives/Button';
import { IconButton } from '@shared/ui/primitives/IconButton';
import { Loading } from '@shared/ui/primitives/Loading/Loading';
import { Textarea } from '@shared/ui/primitives/Textarea';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { MethodColorDot } from '../components/MethodColorDot/MethodColorDot';
import type { MethodReferenceLocation } from './collectMethodReferences';
import type { TestInputValue } from './testMethodInputValue';

export type TestMethodInputRowHandlers = {
	onTextChange: (key: string, text: string) => void;
	onToggleKind: (key: string) => void;
	onReset: (key: string) => void;
};

type Props = TestMethodInputRowHandlers & {
	inputKey: string;
	value: TestInputValue;
	isResolving: boolean;
	isMissing: boolean;
	color?: string;
	label: string;
	path: string;
	locations: MethodReferenceLocation[];
};

export function TestMethodInputRow({ inputKey, value, isResolving, isMissing, color, label, path, locations,
	onTextChange, onToggleKind, onReset }: Props) {
	const { t } = useI18n('workflow');
	const testId = (part: string) => buildTestId('workflow-test-method-input', inputKey, part);

	return (
		<div className='testMethodRow' data-testid={testId('row')}>
			<div className='testMethodRowHeader'>
				{color && <MethodColorDot color={color} size={12} />}
				<span className='testMethodRowLabel'>{label}</span>
				<span className='testMethodRowPath' title={path}>{path}</span>
				{locations.map((location) => (
					<span key={location} className='testMethodTag'>{t(`testMethod.location.${location}`)}</span>
				))}
				<span className='testMethodRowSpacer' />
				{isResolving
					? <Loading size='xs' inline />
					: <span className={`testMethodSource testMethodSource--${value.source}`}>
						{t(`testMethod.source.${value.source}`)}
					</span>}
				<Tooltip content={t(value.kind === 'string' ? 'testMethod.kind.stringHint' : 'testMethod.kind.jsonHint')}>
					<Button type='text' onClick={() => onToggleKind(inputKey)} testId={testId('kind')}
						className='testMethodKindToggle'>
						{t(value.kind === 'string' ? 'testMethod.kind.string' : 'testMethod.kind.json')}
					</Button>
				</Tooltip>
				<Tooltip content={t('testMethod.reset')}>
					<IconButton type='text' size='xs' iconProps={{ name: 'undo' }} onClick={() => onReset(inputKey)}
						testId={testId('reset')} />
				</Tooltip>
			</div>
			<Textarea value={value.text} error={isMissing} testId={testId('value')}
				placeholder={t('testMethod.inputs.placeholder')}
				onChange={(event) => onTextChange(inputKey, event.target.value)} />
		</div>
	);
}
