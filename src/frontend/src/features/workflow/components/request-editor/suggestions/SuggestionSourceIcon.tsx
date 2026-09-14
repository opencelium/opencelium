import { resolveConnectorIconUrl } from '@entities/connector/model/iconUrl';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Icon } from '@shared/ui/primitives/Icon';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { MethodConnectorChip } from '../body-editor/MethodConnectorChip/MethodConnectorChip';
import { getMethodConnectorChipInfo } from '../body-editor/requestReferenceOptions';
import { MethodColorDot } from '../../MethodColorDot/MethodColorDot';
import { readableTextColor } from '../../../utils/methodColor';
import type { MethodWithId } from '../../../types/connection';

type Props = {
	method?: MethodWithId;
	color: string;
	tooltipZIndex?: number;
};

const GLYPH_BY_KIND = {
	connector: 'connector',
	webhook: 'webhook',
	'http-request': 'http-request',
} as const;

/**
 * Who the value comes from, in one 20px slot. A connector that has its own icon shows it
 * and nothing else — a product logo is the strongest identifier available and a colour
 * ring around it only adds noise. Everything else falls back to the method's workflow
 * colour as the background, which is how the rest of the editor names that method, with
 * the method-type glyph on top so a webhook still reads as a webhook.
 */
export function SuggestionSourceIcon({ method, color, tooltipZIndex }: Props) {
	const { t } = useI18n('workflow');
	if (!method) return <MethodColorDot color={color} size={20} />;

	const chip = getMethodConnectorChipInfo(method);
	if (chip.kind === 'connector' && resolveConnectorIconUrl(chip.iconUrl)) {
		return (
			<span className='wfSuggestionSourceIcon'>
				<MethodConnectorChip method={method} iconOnly iconSize={16}
					tooltipZIndex={tooltipZIndex} />
			</span>
		);
	}

	const tooltip = chip.kind === 'webhook' ? t('refGenerator.webhookTriggerHint') : chip.title;
	return (
		<Tooltip content={tooltip} placement='right' zIndex={tooltipZIndex}>
			<span className='wfSuggestionSourceIcon'
				style={{ background: color, color: readableTextColor(color) }}>
				<Icon name={GLYPH_BY_KIND[chip.kind]} size={12} color='inherit' />
			</span>
		</Tooltip>
	);
}
