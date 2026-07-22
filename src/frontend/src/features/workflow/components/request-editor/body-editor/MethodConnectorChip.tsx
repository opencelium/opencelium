import { Icon } from '@shared/ui/primitives/Icon';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { ConnectorIcon } from '@entities/connector/ui/ConnectorIcon';
import { resolveConnectorIconUrl } from '@entities/connector/model/iconUrl';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { MethodWithId } from '../../../types/connection';
import { getMethodConnectorChipInfo } from './requestReferenceOptions';

type Props = {
  method: MethodWithId;
  iconOnly?: boolean;
  iconSize?: number;
  tooltipZIndex?: number;
  /** Skip the chip's own tooltip — for webhook rows, the caller wraps the whole option instead. */
  disableTooltip?: boolean;
};

export function MethodConnectorChip({ method, iconOnly = false, iconSize = 16, tooltipZIndex, disableTooltip = false }: Props) {
  const { t } = useI18n('workflow');
  const chip = getMethodConnectorChipInfo(method);

  // Mirrors ConnectorMethodNode's own fallback: when the connector has no icon, show the
  // same generic "connector" glyph the canvas node shows instead of a default placeholder image.
  const icon = chip.kind === 'connector'
    ? (resolveConnectorIconUrl(chip.iconUrl)
      ? <ConnectorIcon icon={chip.iconUrl} size={iconSize} style={{ flexShrink: 0 }} />
      : <Icon name='connector' size={iconSize} />)
    : <Icon name={chip.kind === 'webhook' ? 'webhook' : 'http-request'} size={iconSize} />;

  const tooltipContent = chip.kind === 'webhook' ? t('refGenerator.webhookTriggerHint') : chip.title;

  // Short names must never be squeezed out by a long method name on the left — only
  // shrink (and cap at 50%) once the title is long enough to actually need truncating.
  const isShortTitle = chip.title.length < 13;

  const content = (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        minWidth: 0,
        color: 'var(--color-text-secondary)',
        fontSize: 11,
      }}
    >
      {iconOnly ? null : (
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
          {chip.title}
        </span>
      )}
      {icon}
    </span>
  );

  // `Tooltip` wraps `children` in its own unstyled flex `<span>`, so width/overflow
  // constraints put on the content *inside* it never reach the actual flex item in the
  // option row — the outer `<span>` here is what the parent flex row sees and shrinks.
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        minWidth: 0,
        flexShrink: iconOnly || isShortTitle ? 0 : 1,
        maxWidth: iconOnly || isShortTitle ? undefined : '50%',
        overflow: iconOnly || isShortTitle ? undefined : 'hidden',
      }}
    >
      {disableTooltip ? content : (
        <Tooltip content={tooltipContent} placement='right' zIndex={tooltipZIndex}>
          {content}
        </Tooltip>
      )}
    </span>
  );
}
