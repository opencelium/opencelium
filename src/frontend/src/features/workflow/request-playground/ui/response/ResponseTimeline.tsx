import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { PlaygroundTimings } from '../../model/playground.types';

const PHASES: { key: keyof PlaygroundTimings; labelKey: string }[] = [
	{ key: 'dnsMs', labelKey: 'requestPlayground.response.timeline.dns' },
	{ key: 'connectMs', labelKey: 'requestPlayground.response.timeline.connect' },
	{ key: 'tlsMs', labelKey: 'requestPlayground.response.timeline.tls' },
	{ key: 'firstByteMs', labelKey: 'requestPlayground.response.timeline.firstByte' },
	{ key: 'downloadMs', labelKey: 'requestPlayground.response.timeline.download' },
];

// Bars too short to see still get a sliver, so every phase stays visible.
const MIN_BAR_PERCENT = 1.2;

type Props = { timings: PlaygroundTimings | undefined; durationMs: number };

export function ResponseTimeline({ timings, durationMs }: Props) {
	const { t } = useI18n('workflow');
	if (!timings) return <div className='rpTabBody rpEmptyNote'>{t('requestPlayground.response.timeline.unavailable')}</div>;

	const total = PHASES.reduce((sum, { key }) => sum + timings[key], 0) || 1;
	const offsetOf = (index: number) => PHASES.slice(0, index).reduce((sum, { key }) => sum + timings[key], 0);
	return (
		<div className='rpTabBody' data-testid='request-playground-timeline'>
			<div className='rpTimeline'>
				{PHASES.map(({ key, labelKey }, index) => {
					const left = (offsetOf(index) / total) * 100;
					return (
						<div key={key} className='rpTimelineRow'>
							<span>{t(labelKey)}</span>
							<span className='rpTimelineTrack'>
								<span className='rpTimelineBar'
									style={{ left: `${left}%`, width: `${Math.max(MIN_BAR_PERCENT, (timings[key] / total) * 100)}%` }} />
							</span>
							<span className='rpMono rpAlignEnd'>{t('requestPlayground.response.duration', { ms: timings[key] })}</span>
						</div>
					);
				})}
				<div className='rpTimelineRow rpTimelineTotal'>
					<span>{t('requestPlayground.response.timeline.total')}</span>
					<span />
					<span className='rpMono rpAlignEnd'>{t('requestPlayground.response.duration', { ms: durationMs })}</span>
				</div>
			</div>
		</div>
	);
}
