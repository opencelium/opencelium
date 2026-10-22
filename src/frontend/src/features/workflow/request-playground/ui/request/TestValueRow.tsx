import { useEffect, useRef, type ReactNode } from 'react';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { buildTestId } from '@shared/testing/testId';
import { IconButton } from '@shared/ui/primitives/IconButton';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { MethodColorDot } from '../../../components/MethodColorDot/MethodColorDot';
import type { BadgeTone } from '../PlaygroundBadge';
import { PlaygroundBadge } from '../PlaygroundBadge';
import type { ValueRow } from './valueRows';

type Props = {
	row: ValueRow;
	badge: { tone: BadgeTone; label: ReactNode; hint?: string };
	isEdited: boolean;
	isFocused: boolean;
	control: ReactNode;
	extra?: ReactNode;
	onReset: () => void;
};

export function TestValueRow({ row, badge, isEdited, isFocused, control, extra, onReset }: Props) {
	const { t } = useI18n('workflow');
	const ref = useRef<HTMLDivElement | null>(null);
	const testId = (part: string) => buildTestId('request-playground-value', row.key, part);

	useEffect(() => {
		if (!isFocused) return;
		ref.current?.scrollIntoView({ block: 'nearest' });
		ref.current?.querySelector<HTMLElement>('input, textarea')?.focus();
	}, [isFocused]);

	return (
		<div ref={ref} className={['rpGridRow rpValueRow', isEdited && 'rpValueRow--edited', isFocused && 'rpValueRow--focused']
			.filter(Boolean).join(' ')} data-testid={testId('row')}>
			<div className='rpValueField'>
				<span className='rpValuePath' title={row.field}>
					{row.kind === 'input' && row.color && <MethodColorDot color={row.color} size={8} />}
					<span className='rpMono rpEllipsis'>{row.field}</span>
				</span>
				<span className='rpValueDescription rpEllipsis' title={row.description}>{row.description}</span>
			</div>
			<div className='rpValueControl'>{control}</div>
			<div className='rpValueMeta'>
				{extra}
				<PlaygroundBadge tone={badge.tone} hint={badge.hint} testId={testId('source')}>{badge.label}</PlaygroundBadge>
				{isEdited && (
					<Tooltip content={t('requestPlayground.values.reset')}>
						<IconButton iconProps={{ name: 'undo' }} type='text' size='xs' onClick={onReset} testId={testId('reset')} />
					</Tooltip>
				)}
			</div>
		</div>
	);
}
