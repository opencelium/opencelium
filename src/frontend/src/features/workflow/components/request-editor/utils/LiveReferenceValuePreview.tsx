import { useState } from 'react';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Loading } from '@shared/ui/primitives/Loading/Loading';
import { LiveReferenceValueDialog } from './LiveReferenceValueDialog';
import { truncateLiveValueText } from './useLiveReferenceValue';

type Props = {
  label: string;
  /** Set false where the value speaks for itself (e.g. the endpoint/URL editor's
   * inline reference pills) — renders just the value/spinner, no "label = " prefix.
   * The label is still used as the expand dialog's title either way. */
  showLabel?: boolean;
  isLoading: boolean;
  hasValue: boolean;
  rawValue: unknown;
  formattedValue: string | null;
};

// Shared tooltip-content shape for every reference-chip consumer (BodyPointer,
// RequestReferenceTokens, XmlReferenceTokens, EndpointArgHoverTooltip): "label"
// while unresolved, "label = [spinner]" while the request is in flight,
// "label = value" once resolved — with a truncated preview plus a "more…" link
// opening the full value (JSON rendered via react-json-view) when it's over
// the preview limit.
export function LiveReferenceValuePreview({ label, showLabel = true, isLoading, hasValue, rawValue, formattedValue }: Props) {
  const { t: tWorkflow } = useI18n('workflow');
  const [dialogOpen, setDialogOpen] = useState(false);

  if (isLoading) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        {showLabel && <>{label} = </>}
        <Loading size="xs" inline />
      </span>
    );
  }

  if (!hasValue || formattedValue === null) {
    return showLabel ? <>{label}</> : null;
  }

  const { text, isTruncated } = truncateLiveValueText(formattedValue);

  return (
    <>
      {/* Plain inline flow (not flex) so long text actually wraps inside the
          tooltip's max-width instead of forcing it wider — a flex row's items
          refuse to shrink below their unwrapped content size by default. */}
      <span style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
        {showLabel && <>{label} = </>}
        {text}
        {isTruncated && (
          <span
            onClick={(event) => {
              event.stopPropagation();
              setDialogOpen(true);
            }}
            data-testid="workflow-reference-value-expand"
            style={{
              color: 'var(--color-action-primary)',
              cursor: 'pointer',
              textDecoration: 'underline',
              marginLeft: 4,
              whiteSpace: 'nowrap',
            }}
          >
            {tWorkflow('references.more')}
          </span>
        )}
      </span>
      {isTruncated && (
        <LiveReferenceValueDialog open={dialogOpen} onClose={() => setDialogOpen(false)} label={label} value={rawValue} />
      )}
    </>
  );
}
