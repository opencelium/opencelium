import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { argLocation } from '../EnhancementArgs/argLocation';
import { MarqueeText } from './MarqueeText';
import { EnhancementArgLine } from '../EnhancementArgs/EnhancementArgLine';
import type { ParsedArgEntry } from '../EnhancementArgs/EnhancementArgs.types';

type Props = { reference: string; entry?: ParsedArgEntry };

export function PlaygroundReference({ reference, entry }: Props) {
	const { t } = useI18n('workflow');
	if (!entry) return <code className="scriptPlaygroundReference">{reference}</code>;
	const { locationKey, field } = argLocation(entry);
	// The body is the common case, so it gets the short label; headers, status and URL keep theirs.
	const location =
		entry.messageProperty === 'body' ? t(`sandbox.source.${entry.direction}`) : t(locationKey);
	const isStatus = entry.messageProperty === 'status';
	return (
		<Tooltip content={<EnhancementArgLine entry={entry} />} maxWidth={420}>
			<span className="scriptPlaygroundReference">
				<span className="scriptPlaygroundMethod" style={{ backgroundColor: entry.color }}>
					{entry.methodName}
				</span>
				<span className="scriptPlaygroundLocation">{location}</span>
				{!isStatus && field && (
					<>
						<span aria-hidden>›</span>
						<MarqueeText className="scriptPlaygroundField" text={field} />
					</>
				)}
			</span>
		</Tooltip>
	);
}
